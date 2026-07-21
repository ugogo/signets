import type { SyncShotInput } from '@signets/shared';

import {
  buildBookmarksRequestUrl,
  extractBottomCursor,
  type BookmarksRequestParams,
} from './bookmarks-api.js';
import {
  countTimelineEntries,
  filterShotsNewerThanLastSync,
  isAtOrBeforeLastSync,
  normalizeBookmarksResponse,
} from './bookmarks-parser.js';
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

function isTrustedBridgeSecret(value: unknown): value is string {
  return typeof value === 'string' && value === BRIDGE_SECRET;
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

function readTrustedBookmarksBody(detail: unknown): unknown | undefined {
  if (!detail || typeof detail !== 'object' || !('bridgeSecret' in detail)) {
    return undefined;
  }

  const record = detail as { body?: unknown; bridgeSecret?: string };
  if (!isTrustedBridgeSecret(record.bridgeSecret)) {
    return undefined;
  }

  return record.body;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetCaptureState(
  lastBookmarkSyncAt?: null | string,
): void {
  capturedShots.length = 0;
  activeLastBookmarkSyncAt = lastBookmarkSyncAt ?? null;
  bookmarksResponseSeen = false;
  lastBottomCursor = undefined;
  capturedRequestParams = undefined;
  reachedLastBookmarkSync = false;
  captureAborted = false;
  captureReady = false;
}

function emitBookmarksIntercepted(result: {
  entries: number;
  newShots: number;
  parsed: number;
}): void {
  void chrome.runtime.sendMessage({
    entries: result.entries,
    parsed: result.parsed,
    total: capturedShots.length,
    type: 'bookmarks-intercepted',
    ...(activeLastBookmarkSyncAt ? { newShots: result.newShots } : {}),
  });
}

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

function ingestBookmarksBody(body: unknown): {
  entries: number;
  newShots: number;
  parsed: number;
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

    lastBottomCursor = extractBottomCursor(typedBody);

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

function processBookmarksBody(body: unknown): void {
  emitBookmarksIntercepted(ingestBookmarksBody(body));
}

function flushPendingBookmarkBodies(): void {
  while (pendingBookmarkBodies.length > 0) {
    const body = pendingBookmarkBodies.shift();
    if (body) {
      processBookmarksBody(body);
    }
  }
}

window.addEventListener(BOOKMARKS_RESPONSE_EVENT, (event) => {
  const body = readTrustedBookmarksBody((event as CustomEvent).detail);
  if (body === undefined) {
    return;
  }

  if (!captureReady) {
    pendingBookmarkBodies.push(body);
    return;
  }

  processBookmarksBody(body);
});

window.addEventListener(BOOKMARKS_REQUEST_EVENT, (event) => {
  const params = readTrustedRequestParams((event as CustomEvent).detail);
  if (params) {
    capturedRequestParams = params;
  }
});

function waitForRequestParams(timeoutMs: number): Promise<BookmarksRequestParams> {
  if (capturedRequestParams) {
    return Promise.resolve(capturedRequestParams);
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(
        BOOKMARKS_REQUEST_EVENT,
        listener as EventListener,
      );
      reject(new Error('Timed out waiting for bookmarks API request.'));
    }, timeoutMs);

    const listener = (event: Event) => {
      const params = readTrustedRequestParams(
        (event as CustomEvent).detail,
      );
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
    await sleep(waitMs);
    return fetchBookmarksPage(params, cursor, rateLimitRetries + 1);
  }

  if (!response.ok) {
    throw new Error(`Bookmarks API returned ${response.status}.`);
  }

  return response.json();
}

function abortCapture(): void {
  captureAborted = true;
  removeSyncOverlay();
}

function requestStopCapture(): void {
  abortCapture();
  // Notify the background so the side panel reflects the stop immediately.
  void chrome.runtime.sendMessage({ type: 'stop-sync' }).catch(() => undefined);
}

async function captureAllBookmarks(
  lastBookmarkSyncAt?: null | string,
): Promise<{ count: number; stopped: boolean }> {
  resetCaptureState(lastBookmarkSyncAt);
  captureReady = true;
  flushPendingBookmarkBodies();
  showSyncOverlay(requestStopCapture);
  updateSyncOverlay(capturedShots.length);

  try {
    let params = capturedRequestParams;
    if (!params) {
      try {
        params = await waitForRequestParams(REQUEST_PARAMS_TIMEOUT_MS);
      } catch {
        return { count: capturedShots.length, stopped: captureAborted };
      }
    }

    for (let attempt = 0; attempt < 20 && !bookmarksResponseSeen; attempt += 1) {
      await sleep(300);
    }

    if (reachedLastBookmarkSync) {
      return { count: capturedShots.length, stopped: captureAborted };
    }

    let cursor = lastBottomCursor;
    let idlePages = 0;

    while (!captureAborted && idlePages < 3 && cursor) {
      const beforeCount = capturedShots.length;
      const previousCursor = cursor;

      try {
        const body = await fetchBookmarksPage(params, cursor);
        const pageResult = ingestBookmarksBody(body);
        emitBookmarksIntercepted(pageResult);

        if (
          activeLastBookmarkSyncAt &&
          (reachedLastBookmarkSync ||
            isAtOrBeforeLastSync(
              normalizeBookmarksResponse(
                body as Parameters<typeof normalizeBookmarksResponse>[0],
              ),
              activeLastBookmarkSyncAt,
            ))
        ) {
          break;
        }
      } catch (error) {
        throw error instanceof Error
          ? error
          : new Error('Failed to fetch bookmarks page.');
      }

      cursor = lastBottomCursor;

      if (
        capturedShots.length === beforeCount ||
        !cursor ||
        cursor === previousCursor
      ) {
        idlePages += 1;
      } else {
        idlePages = 0;
      }

      await sleep(PAGE_FETCH_DELAY_MS);
    }

    return { count: capturedShots.length, stopped: captureAborted };
  } finally {
    removeSyncOverlay();
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    return;
  }

  if (message.type === 'clear-captured-shots') {
    resetCaptureState();
    pendingBookmarkBodies.length = 0;
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
