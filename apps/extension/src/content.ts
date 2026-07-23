import type { SyncShotInput } from '@signets/shared';

import {
  type BookmarksRequestParams,
  buildBookmarksRequestUrl,
  extractBottomCursor,
} from './bookmarks-api.js';
import {
  countTimelineEntries,
  filterShotsNewerThanLastSync,
  normalizeBookmarksResponse,
} from './bookmarks-parser.js';
import { formatCursorPreview, logCapture } from './capture-log.js';
import {
  BOOKMARKS_REQUEST_EVENT,
  BOOKMARKS_RESPONSE_EVENT,
} from './constants.js';
import { isExtensionMessage } from './messages.js';
import { BRIDGE_SECRET } from './page-interceptor-bootstrap.js';
import {
  removeSyncOverlay,
  showSyncOverlay,
  updateSyncOverlay,
} from './sync-overlay.js';

const capturedShots: SyncShotInput[] = [];
const pendingBookmarkBodies: unknown[] = [];
const PAGE_FETCH_DELAY_MS = 600;
const REQUEST_PARAMS_TIMEOUT_MS = 20_000;
const MAX_429_RETRIES = 5;

let captureAborted = false;
let captureReady = false;
let bookmarksResponseSeen = false;
let activeLastBookmarkSyncAt: null | string = null;
let lastBottomCursor: string | undefined;
let capturedRequestParams: BookmarksRequestParams | undefined;
let reachedLastBookmarkSync = false;
let capturePageNumber = 0;
let ignoreScrollIntercepts = false;
let lastLoggedQueryKey: string | undefined;

function addCapturedShots(shots: SyncShotInput[]): void {
  for (const shot of shots) {
    if (!capturedShots.some((existing) => existing.mediaId === shot.mediaId)) {
      capturedShots.push(shot);
    }
  }

  updateSyncOverlay(capturedShots.length);

  void chrome.runtime.sendMessage({
    count: capturedShots.length,
    type: 'shots-captured',
  });
}

function emitBookmarksIntercepted(result: {
  cursorPreview?: string;
  entries: number;
  hasMore?: boolean;
  newShots: number;
  page?: number;
  parsed: number;
  source?: 'fetch' | 'intercept' | 'pending';
}): void {
  void chrome.runtime.sendMessage({
    cursorPreview: result.cursorPreview,
    entries: result.entries,
    hasMore: result.hasMore,
    page: result.page,
    parsed: result.parsed,
    total: capturedShots.length,
    type: 'bookmarks-intercepted',
    ...(activeLastBookmarkSyncAt ? { newShots: result.newShots } : {}),
    ...(result.source ? { source: result.source } : {}),
  });
}

function flushPendingBookmarkBodies(): void {
  while (pendingBookmarkBodies.length > 0) {
    const body = pendingBookmarkBodies.shift();
    if (body) {
      processBookmarksBody(body, 'pending');
    }
  }
}

function ingestBookmarksBody(body: unknown): {
  entries: number;
  newShots: number;
  parsed: number;
  skipped?: boolean;
} {
  bookmarksResponseSeen = true;

  try {
    const typedBody = body as Parameters<typeof normalizeBookmarksResponse>[0];
    const entries = countTimelineEntries(typedBody);
    const parsedShots = normalizeBookmarksResponse(typedBody);
    const newShots = filterShotsNewerThanLastSync(
      parsedShots,
      activeLastBookmarkSyncAt,
    );
    const nextCursor = extractBottomCursor(typedBody);
    const isDuplicatePage =
      capturePageNumber > 0 &&
      parsedShots.length > 0 &&
      newShots.length === 0 &&
      nextCursor === lastBottomCursor;

    if (isDuplicatePage) {
      logCapture(
        'info',
        `Skipping duplicate bookmarks page (cursor ${formatCursorPreview(nextCursor)}).`,
      );
      return {
        entries,
        newShots: 0,
        parsed: parsedShots.length,
        skipped: true,
      };
    }

    lastBottomCursor = nextCursor;

    if (
      activeLastBookmarkSyncAt &&
      parsedShots.length > 0 &&
      newShots.length === 0
    ) {
      reachedLastBookmarkSync = true;
    }

    if (newShots.length > 0) {
      addCapturedShots(newShots);
    }

    return {
      entries,
      newShots: newShots.length,
      parsed: parsedShots.length,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to parse bookmarks body';
    throw new Error(message);
  }
}

function isTrustedBridgeSecret(value: unknown): value is string {
  return typeof value === 'string' && value === BRIDGE_SECRET;
}

function processBookmarksBody(
  body: unknown,
  source: 'fetch' | 'intercept' | 'pending' = 'intercept',
): void {
  const result = ingestBookmarksBody(body);
  if (result.skipped) {
    return;
  }

  capturePageNumber += 1;
  reportBookmarksPage(result, source);
}

function readTrustedBookmarksBody(detail: unknown): unknown {
  if (!detail || typeof detail !== 'object' || !('bridgeSecret' in detail)) {
    return undefined;
  }

  const record = detail as { body?: unknown; bridgeSecret?: string };
  if (!isTrustedBridgeSecret(record.bridgeSecret)) {
    return undefined;
  }

  return record.body;
}

function readTrustedRequestParams(
  detail: unknown,
): BookmarksRequestParams | undefined {
  if (!detail || typeof detail !== 'object' || !('bridgeSecret' in detail)) {
    return undefined;
  }

  const record = detail as BookmarksRequestParams & { bridgeSecret?: string };
  if (!isTrustedBridgeSecret(record.bridgeSecret)) {
    return undefined;
  }

  return record;
}

function rememberRequestParams(
  params: Omit<BookmarksRequestParams, 'headers'>,
): void {
  const queryKey = `${params.operation}:${params.queryId}`;
  if (queryKey !== lastLoggedQueryKey) {
    lastLoggedQueryKey = queryKey;
    logCapture(
      'info',
      `Captured bookmarks API params (${params.operation}, query ${params.queryId.slice(0, 8)}…).`,
    );
  }
}

function reportBookmarksPage(
  result: {
    entries: number;
    newShots: number;
    parsed: number;
  },
  source: 'fetch' | 'intercept' | 'pending',
): void {
  emitBookmarksIntercepted({
    ...result,
    cursorPreview: formatCursorPreview(lastBottomCursor),
    hasMore: Boolean(lastBottomCursor),
    page: capturePageNumber,
    source,
  });
}

function resetCaptureState(lastBookmarkSyncAt?: null | string): void {
  capturedShots.length = 0;
  activeLastBookmarkSyncAt = lastBookmarkSyncAt ?? null;
  bookmarksResponseSeen = false;
  lastBottomCursor = undefined;
  reachedLastBookmarkSync = false;
  captureAborted = false;
  captureReady = false;
  capturePageNumber = 0;
  ignoreScrollIntercepts = false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

window.addEventListener(BOOKMARKS_RESPONSE_EVENT, (event) => {
  const body = readTrustedBookmarksBody((event as CustomEvent).detail);
  if (body === undefined) {
    return;
  }

  if (!captureReady) {
    pendingBookmarkBodies.push(body);
    if (pendingBookmarkBodies.length === 1) {
      logCapture(
        'info',
        `Queued bookmarks response until capture starts (${pendingBookmarkBodies.length} pending).`,
      );
    }
    return;
  }

  if (ignoreScrollIntercepts) {
    return;
  }

  processBookmarksBody(body, 'intercept');
});

window.addEventListener(BOOKMARKS_REQUEST_EVENT, (event) => {
  const params = readTrustedRequestParams((event as CustomEvent).detail);
  if (!params) {
    return;
  }

  if (capturedRequestParams) {
    capturedRequestParams = {
      ...capturedRequestParams,
      features: params.features,
      ...(params.fieldToggles ? { fieldToggles: params.fieldToggles } : {}),
      headers: params.headers,
      operation: params.operation,
      queryId: params.queryId,
      variables: params.variables,
    };
    return;
  }

  capturedRequestParams = { ...params, headers: params.headers };
  rememberRequestParams(params);
});

function abortCapture(): void {
  captureAborted = true;
  removeSyncOverlay();
}

async function captureAllBookmarks(
  lastBookmarkSyncAt?: null | string,
): Promise<{ count: number; error?: string; stopped: boolean }> {
  resetCaptureState(lastBookmarkSyncAt);
  logCapture(
    'info',
    lastBookmarkSyncAt
      ? `Capture started (incremental watermark ${lastBookmarkSyncAt}).`
      : 'Capture started (full sync).',
  );
  captureReady = true;
  const pendingCount = pendingBookmarkBodies.length;
  if (pendingCount > 0) {
    logCapture(
      'info',
      `Processing ${pendingCount} queued bookmarks response${pendingCount === 1 ? '' : 's'}.`,
    );
  }
  flushPendingBookmarkBodies();
  showSyncOverlay(requestStopCapture);
  updateSyncOverlay(capturedShots.length);

  try {
    let params = capturedRequestParams;
    if (!params && !bookmarksResponseSeen) {
      logCapture('info', 'Waiting for X bookmarks API request…');
      try {
        params = await waitForRequestParams(REQUEST_PARAMS_TIMEOUT_MS);
      } catch {
        logCapture('error', 'Timed out waiting for bookmarks API request.');
        return {
          count: capturedShots.length,
          error:
            'Timed out waiting for X bookmarks API. Make sure you are logged into x.com, then try again.',
          stopped: captureAborted,
        };
      }
    }

    if (!params) {
      logCapture(
        'error',
        'Captured bookmarks but API params are missing — cannot paginate.',
      );
      return {
        count: capturedShots.length,
        error:
          'Bookmarks were captured but pagination params were lost. Reload and try again.',
        stopped: captureAborted,
      };
    }

    logCapture(
      'info',
      `Using ${params.operation} (count ${String(params.variables.count ?? 'default')}).`,
    );

    for (
      let attempt = 0;
      attempt < 20 && !bookmarksResponseSeen;
      attempt += 1
    ) {
      await sleep(300);
    }

    if (!bookmarksResponseSeen && capturedShots.length === 0) {
      logCapture('error', 'No bookmarks API responses captured on first page.');
      return {
        count: capturedShots.length,
        error:
          'X bookmarks API responses were not captured. Reload the extension and try again.',
        stopped: captureAborted,
      };
    }

    logCapture(
      'info',
      `First page ready — ${capturedShots.length} shot${capturedShots.length === 1 ? '' : 's'}, next cursor ${formatCursorPreview(lastBottomCursor)}.`,
    );

    if (reachedLastBookmarkSync) {
      logCapture('info', 'Reached incremental sync watermark on first page.');
      return { count: capturedShots.length, stopped: captureAborted };
    }

    if (!lastBottomCursor) {
      logCapture('info', 'No bottom cursor — single-page bookmarks timeline.');
    } else {
      logCapture('info', 'Paginating remaining bookmark pages…');
    }

    await paginateRemainingBookmarks(params);

    logCapture(
      'success',
      `Capture finished — ${capturedShots.length} shot${capturedShots.length === 1 ? '' : 's'} across ${capturePageNumber} page${capturePageNumber === 1 ? '' : 's'}.`,
    );

    return { count: capturedShots.length, stopped: captureAborted };
  } finally {
    removeSyncOverlay();
  }
}

async function fetchBookmarksPage(
  params: BookmarksRequestParams,
  cursor: string,
  rateLimitRetries = 0,
): Promise<unknown> {
  const response = await fetch(buildBookmarksRequestUrl(params, cursor), {
    credentials: 'include',
    headers: params.headers,
  });

  if (response.status === 429) {
    if (rateLimitRetries >= MAX_429_RETRIES) {
      throw new Error('Bookmarks API rate limited too many times.');
    }

    const retryAfter = Number(response.headers.get('retry-after'));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 15_000;
    logCapture(
      'warn',
      `Bookmarks API rate limited — retrying in ${Math.round(waitMs / 1000)}s (attempt ${rateLimitRetries + 1}/${MAX_429_RETRIES}).`,
    );
    await sleep(waitMs);
    return fetchBookmarksPage(params, cursor, rateLimitRetries + 1);
  }

  if (!response.ok) {
    throw new Error(`Bookmarks API returned ${response.status}.`);
  }

  return response.json();
}

async function paginateRemainingBookmarks(
  params: BookmarksRequestParams,
): Promise<void> {
  while (!captureAborted && lastBottomCursor) {
    if (reachedLastBookmarkSync) {
      logCapture(
        'info',
        'Stopping pagination — reached incremental watermark.',
      );
      break;
    }

    const previousCursor = lastBottomCursor;
    const previousPage = capturePageNumber;
    const nextPage = capturePageNumber + 1;

    logCapture(
      'info',
      `Fetching page ${nextPage} (cursor ${formatCursorPreview(previousCursor)})…`,
    );

    let advanced = false;

    try {
      ignoreScrollIntercepts = true;
      const body = await fetchBookmarksPage(params, previousCursor);
      processBookmarksBody(body, 'fetch');
      advanced =
        capturePageNumber > previousPage || lastBottomCursor !== previousCursor;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Direct fetch failed.';
      logCapture(
        'info',
        `Direct fetch failed (${message}) — trying scroll fallback…`,
      );
      window.scrollTo(0, document.documentElement.scrollHeight);
      advanced = await waitForBookmarkProgress(
        previousCursor,
        8_000,
        previousPage,
      );
    } finally {
      ignoreScrollIntercepts = false;
    }

    if (reachedLastBookmarkSync) {
      logCapture(
        'info',
        'Stopping pagination — reached incremental watermark.',
      );
      break;
    }

    if (!lastBottomCursor) {
      logCapture('info', 'Stopping pagination — no bottom cursor in response.');
      break;
    }

    if (!advanced || lastBottomCursor === previousCursor) {
      logCapture(
        'info',
        'Stopping pagination — cursor unchanged (end of bookmarks).',
      );
      break;
    }

    await sleep(PAGE_FETCH_DELAY_MS);
  }
}

function requestStopCapture(): void {
  abortCapture();
  // Notify the background so the side panel reflects the stop immediately.
  void chrome.runtime.sendMessage({ type: 'stop-sync' }).catch(() => undefined);
}

async function waitForBookmarkProgress(
  previousCursor: string,
  timeoutMs: number,
  previousPage = capturePageNumber,
): Promise<boolean> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (captureAborted || reachedLastBookmarkSync) {
      return true;
    }

    if (capturePageNumber > previousPage) {
      return true;
    }

    if (lastBottomCursor && lastBottomCursor !== previousCursor) {
      return true;
    }

    await sleep(300);
  }

  return false;
}

function waitForRequestParams(
  timeoutMs: number,
): Promise<BookmarksRequestParams> {
  if (capturedRequestParams) {
    return Promise.resolve(capturedRequestParams);
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(BOOKMARKS_REQUEST_EVENT, listener);
      reject(new Error('Timed out waiting for bookmarks API request.'));
    }, timeoutMs);

    const listener = (event: Event) => {
      const params = readTrustedRequestParams((event as CustomEvent).detail);
      if (!params) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener(BOOKMARKS_REQUEST_EVENT, listener);
      resolve(params);
    };

    window.addEventListener(BOOKMARKS_REQUEST_EVENT, listener);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    return;
  }

  if (message.type === 'clear-captured-shots') {
    resetCaptureState();
    pendingBookmarkBodies.length = 0;
    capturedRequestParams = undefined;
    lastLoggedQueryKey = undefined;
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'get-captured-shots') {
    sendResponse({ shots: capturedShots });
    return;
  }

  if (message.type === 'stop-auto-scroll') {
    abortCapture();
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'start-auto-scroll') {
    void captureAllBookmarks(message.lastBookmarkSyncAt).then((result) => {
      sendResponse(result);
    });
    return true;
  }

  return;
});
