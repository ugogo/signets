import type { SyncPayload, SyncResult } from '@signets/shared';

import { signInWithGoogle } from './auth.js';
import { BOOKMARKS_URL, SYNC_BATCH_SIZE, type SyncState } from './constants.js';
import { appendLog, clearLogs, getLogs } from './log.js';
import {
  isAutoScrollResponse,
  isExtensionMessage,
  isGetCapturedShotsResponse,
} from './messages.js';
import { loadSettings } from './settings.js';
import { configureSidePanel } from './side-panel.js';
import {
  fetchSyncState,
  SyncRequestError,
  uploadSyncBatch,
  verifySyncCredentials,
} from './sync-client.js';

type CaptureResult = {
  count: number;
  stopped: boolean;
  tabId: number;
};

let syncState: SyncState = 'idle';
let activeSyncTabId: number | undefined;
let stopRequested = false;
let syncInProgress = false;
let signInInProgress = false;

function broadcastSignInComplete(result: {
  error?: string;
  ok: boolean;
}): void {
  void chrome.runtime
    .sendMessage({ ...result, type: 'sign-in-complete' })
    .catch(() => undefined);
}

async function captureBookmarks(
  label: string,
  lastBookmarkSyncAt?: null | string,
): Promise<CaptureResult & { error?: string }> {
  appendLog('info', `${label}: opening bookmarks page…`);

  const tab = await findOrOpenBookmarksTab();
  if (!tab.id) {
    throw new Error('Could not access bookmarks tab.');
  }

  await waitForTabLoad(tab.id);

  if (lastBookmarkSyncAt) {
    appendLog(
      'info',
      `Incremental sync — skipping bookmarks at or before ${lastBookmarkSyncAt}.`,
    );
  }

  appendLog('info', 'Reloading bookmarks page to capture fresh data…');
  await chrome.tabs.reload(tab.id);
  await waitForTabLoad(tab.id);
  await sleep(1500);

  let scrollResult: { count: number; error?: string; stopped: boolean };
  try {
    scrollResult = await runAutoScroll(tab.id, lastBookmarkSyncAt);
  } catch {
    appendLog(
      'error',
      'Could not connect to bookmarks page. Reload and retry.',
    );
    throw new Error('Could not connect to bookmarks page. Reload and retry.');
  }

  if (scrollResult.error) {
    appendLog('warn', scrollResult.error);
  }

  if (scrollResult.stopped || stopRequested) {
    appendLog(
      'info',
      `Stopped by user — captured ${scrollResult.count} new shots.`,
    );
  } else if (scrollResult.count === 0 && lastBookmarkSyncAt) {
    appendLog('info', 'No new bookmarks since last sync.');
  } else {
    appendLog('info', `Capture complete: ${scrollResult.count} new shots.`);
  }

  return { ...scrollResult, tabId: tab.id };
}

function chunkShots<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

async function findOrOpenBookmarksTab(): Promise<chrome.tabs.Tab> {
  // Scope to the panel's window (the last focused normal window) so the side
  // panel stays present alongside the bookmarks tab while it loads.
  const focusedWindow = await chrome.windows
    .getLastFocused({ windowTypes: ['normal'] })
    .catch(() => undefined);
  const windowId = focusedWindow?.id;

  const tabs = await chrome.tabs.query(
    windowId === undefined ? {} : { windowId },
  );
  const existing = tabs.find((tab) => isBookmarksUrl(tab.url));

  if (existing?.id) {
    appendLog('info', 'Using existing bookmarks tab.');
    await chrome.tabs.update(existing.id, { active: true });
    return existing;
  }

  appendLog('info', 'Opening bookmarks page…');
  const created = await chrome.tabs.create({
    active: true,
    url: BOOKMARKS_URL,
    ...(windowId === undefined ? {} : { windowId }),
  });

  if (!created.id) {
    throw new Error('Could not open bookmarks tab.');
  }

  return created;
}

async function getCapturedShots(tabId: number): Promise<SyncPayload['shots']> {
  const captured: unknown = await chrome.tabs.sendMessage(tabId, {
    type: 'get-captured-shots',
  });

  return isGetCapturedShotsResponse(captured) ? captured.shots : [];
}

function isBookmarksUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === 'x.com' || parsed.hostname === 'twitter.com') &&
      parsed.pathname.startsWith('/i/bookmarks')
    );
  } catch {
    return false;
  }
}

async function runAutoScroll(
  tabId: number,
  lastBookmarkSyncAt?: null | string,
): Promise<{ count: number; error?: string; stopped: boolean }> {
  activeSyncTabId = tabId;
  setSyncState('scrolling');

  const response = await sendTabMessageWithRetry<unknown>(tabId, {
    lastBookmarkSyncAt,
    type: 'start-auto-scroll',
  });

  if (!isAutoScrollResponse(response)) {
    throw new Error('Auto-scroll did not return a valid response.');
  }

  return response;
}

async function runDryRun(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  if (syncInProgress) {
    sendResponse({ error: 'Sync already in progress.', ok: false });
    return;
  }

  syncInProgress = true;
  stopRequested = false;
  activeSyncTabId = undefined;

  try {
    appendLog('info', 'Starting dry run (no upload)…');

    const capture = await captureBookmarks('Dry run');
    const shots = await getCapturedShots(capture.tabId);

    if (shots.length === 0) {
      appendLog(
        'warn',
        capture.error ??
          'No shots found. Log into X and bookmark some media posts.',
      );
      sendResponse({
        error:
          capture.error ??
          'No shots found. Log into X and bookmark some media posts.',
        ok: false,
      });
      return;
    }

    appendLog(
      'success',
      `Dry run complete: ${shots.length} shots ready to sync.`,
    );
    sendResponse({
      captured: shots.length,
      ok: true,
      payload: { shots },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Dry run failed unexpectedly.';
    appendLog('error', message);
    sendResponse({ error: message, ok: false });
  } finally {
    syncInProgress = false;
    stopRequested = false;
    activeSyncTabId = undefined;
    setSyncState('idle');
  }
}

async function runSignIn(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  if (signInInProgress) {
    sendResponse({ error: 'Sign-in already in progress.', ok: false });
    return;
  }

  signInInProgress = true;
  appendLog('info', 'Starting Google sign-in…');

  try {
    const settings = await loadSettings();
    appendLog('info', `Sign-in API: ${settings.apiUrl}`);
    const sessionToken = await signInWithGoogle(settings.apiUrl);
    await chrome.storage.sync.set({ sessionToken });
    appendLog('success', 'Google sign-in completed.');
    sendResponse({ ok: true });
    broadcastSignInComplete({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Sign-in failed unexpectedly.';
    appendLog('error', `Google sign-in failed: ${message}`);
    sendResponse({ error: message, ok: false });
    broadcastSignInComplete({ error: message, ok: false });
  } finally {
    signInInProgress = false;
  }
}

async function runSync(
  sendResponse: (response: unknown) => void,
): Promise<void> {
  if (syncInProgress) {
    sendResponse({ error: 'Sync already in progress.', ok: false });
    return;
  }

  syncInProgress = true;
  stopRequested = false;
  activeSyncTabId = undefined;

  try {
    appendLog('info', 'Starting sync…');

    const settings = await loadSettings();
    if (!settings.sessionToken) {
      appendLog('error', 'Sign in from extension settings first.');
      sendResponse({
        error: 'Sign in from extension settings first.',
        ok: false,
      });
      return;
    }

    appendLog('info', 'Verifying session…');
    await verifySyncCredentials(settings);
    const syncState = await fetchSyncState(settings);
    appendLog(
      'info',
      syncState.lastBookmarkSyncAt
        ? `Server watermark: ${syncState.lastBookmarkSyncAt}`
        : 'Server watermark: none (first sync).',
    );

    const capture = await captureBookmarks(
      'Sync',
      syncState.lastBookmarkSyncAt,
    );

    if (capture.count === 0) {
      if (capture.error) {
        appendLog('warn', capture.error);
        sendResponse({ error: capture.error, ok: false });
        return;
      }

      if (syncState.lastBookmarkSyncAt) {
        appendLog('success', 'Already up to date — nothing new to sync.');
        sendResponse({
          captured: 0,
          ok: true,
          result: {
            lastBookmarkSyncAt: syncState.lastBookmarkSyncAt,
            upserted: 0,
          },
        });
        return;
      }

      appendLog('warn', 'No shots found in bookmarks.');
      sendResponse({
        error: 'No shots found. Log into X and bookmark some media posts.',
        ok: false,
      });
      return;
    }

    const { captured, result } = await uploadShots(settings, capture.tabId);
    appendLog(
      'success',
      `Synced ${result.upserted} new shot${result.upserted === 1 ? '' : 's'}.`,
    );
    sendResponse({ captured, ok: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Sync failed unexpectedly.';
    appendLog('error', message);
    sendResponse({ error: message, ok: false });
  } finally {
    syncInProgress = false;
    stopRequested = false;
    activeSyncTabId = undefined;
    setSyncState('idle');
  }
}

async function sendTabMessageWithRetry<T>(
  tabId: number,
  message: unknown,
  retries = 5,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;
      await sleep(500 * (attempt + 1));
    }
  }

  throw lastError;
}

function setSyncState(state: SyncState): void {
  syncState = state;
  void chrome.runtime
    .sendMessage({ state, type: 'sync-state-changed' })
    .catch(() => undefined);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadShots(
  settings: Awaited<ReturnType<typeof loadSettings>>,
  tabId: number,
): Promise<{ captured: number; result: SyncResult }> {
  setSyncState('uploading');

  const shots = await getCapturedShots(tabId);

  if (shots.length === 0) {
    throw new Error('No shots found in bookmarks.');
  }

  const batches = chunkShots(shots, SYNC_BATCH_SIZE);
  appendLog(
    'info',
    `Uploading ${shots.length} new shot${shots.length === 1 ? '' : 's'} in ${batches.length} batch${batches.length === 1 ? '' : 'es'}…`,
  );

  let upserted = 0;
  let lastBookmarkSyncAt = new Date(0).toISOString();

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index]!;
    appendLog(
      'info',
      `Uploading batch ${index + 1}/${batches.length} (${batch.length} shots)…`,
    );

    try {
      const result = await uploadSyncBatch(settings, batch);
      upserted += result.upserted;
      lastBookmarkSyncAt = result.lastBookmarkSyncAt;
    } catch (error) {
      if (error instanceof SyncRequestError) {
        throw new SyncRequestError(
          `Upload failed on batch ${index + 1}/${batches.length} — ${error.message}`,
          error.status,
        );
      }

      throw error;
    }
  }

  return { captured: shots.length, result: { lastBookmarkSyncAt, upserted } };
}

async function waitForTabLoad(
  tabId: number,
  timeoutMs = 15_000,
): Promise<void> {
  const tab = await chrome.tabs.get(tabId);
  if (tab.status === 'complete') {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Bookmarks page load timed out.'));
    }, timeoutMs);

    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
    ) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    return;
  }

  if (message.type === 'get-logs') {
    sendResponse({ logs: getLogs() });
    return;
  }

  if (message.type === 'clear-logs') {
    clearLogs();
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'get-sync-state') {
    sendResponse({ state: syncState });
    return;
  }

  if (message.type === 'bookmarks-intercepted') {
    const detailParts = [
      message.source ? `via ${message.source}` : undefined,
      message.page !== undefined ? `page ${message.page}` : undefined,
      message.newShots === undefined
        ? `${message.entries} entries, ${message.parsed} media, ${message.total} total`
        : `${message.entries} entries, ${message.newShots} new / ${message.parsed} media, ${message.total} total`,
      message.hasMore === false
        ? 'end of timeline'
        : message.cursorPreview
          ? `next cursor ${message.cursorPreview}`
          : undefined,
    ].filter((part): part is string => Boolean(part));
    appendLog('info', `Bookmarks API — ${detailParts.join(', ')}.`);
    return;
  }

  if (message.type === 'capture-log') {
    appendLog(message.level, message.message);
    return;
  }

  if (message.type === 'shots-captured') {
    appendLog(
      'info',
      `${message.count} shot${message.count === 1 ? '' : 's'} captured so far.`,
    );
    return;
  }

  if (message.type === 'stop-sync') {
    if (!syncInProgress || syncState !== 'scrolling' || !activeSyncTabId) {
      sendResponse({ ok: false });
      return;
    }

    stopRequested = true;
    appendLog('info', 'Stop requested…');

    void chrome.tabs
      .sendMessage(activeSyncTabId, { type: 'stop-auto-scroll' })
      .catch(() => undefined);

    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'dry-run') {
    void runDryRun(sendResponse);
    return true;
  }

  if (message.type === 'sync-now') {
    void runSync(sendResponse);
    return true;
  }

  if (message.type === 'sign-in-with-google') {
    void runSignIn(sendResponse);
    return true;
  }

  return;
});

void configureSidePanel();

export {};
