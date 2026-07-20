import type { SyncShotInput } from '@signets/shared';

import {
  buildBookmarksRequestUrl,
  extractBottomCursor,
  type BookmarksRequestParams,
} from './bookmarks-api.js';
import {
  countTimelineEntries,
  filterShotsNewerThanWatermark,
  isOlderThanWatermark,
  normalizeBookmarksResponse,
} from './bookmarks-parser.js';
import {
  BOOKMARKS_REQUEST_EVENT,
  BOOKMARKS_RESPONSE_EVENT,
} from './constants.js';
import { isExtensionMessage } from './messages.js';
import {
  removeSyncOverlay,
  showSyncOverlay,
  updateSyncOverlay,
} from './sync-overlay.js';

const capturedShots: SyncShotInput[] = [];
const pendingBookmarkBodies: unknown[] = [];
const PAGE_FETCH_DELAY_MS = 600;
const REQUEST_PARAMS_TIMEOUT_MS = 20_000;

let captureAborted = false;
let captureReady = false;
let bookmarksResponseSeen = false;
let captureWatermark: null | string | undefined;
let lastBottomCursor: string | undefined;
let capturedRequestParams: BookmarksRequestParams | undefined;
let reachedSyncWatermark = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetCaptureState(
  lastBookmarkSyncAt?: null | string,
): void {
  capturedShots.length = 0;
  captureWatermark = lastBookmarkSyncAt ?? null;
  bookmarksResponseSeen = false;
  lastBottomCursor = undefined;
  capturedRequestParams = undefined;
  reachedSyncWatermark = false;
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
    ...(captureWatermark ? { newShots: result.newShots } : {}),
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
    const newShots = filterShotsNewerThanWatermark(
      parsedShots,
      captureWatermark,
    );

    lastBottomCursor = extractBottomCursor(typedBody);

    if (
      captureWatermark &&
      parsedShots.length > 0 &&
      newShots.length === 0
    ) {
      reachedSyncWatermark = true;
    }

    if (newShots.length > 0) {
      addCapturedShots(newShots);
    }

    return {
      entries,
      newShots: newShots.length,
      parsed: parsedShots.length,
    };
  } catch {
    return { entries: 0, newShots: 0, parsed: 0 };
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
  const body = (event as CustomEvent).detail;
  if (!captureReady) {
    pendingBookmarkBodies.push(body);
    return;
  }

  processBookmarksBody(body);
});

window.addEventListener(BOOKMARKS_REQUEST_EVENT, (event) => {
  capturedRequestParams = (event as CustomEvent<BookmarksRequestParams>).detail;
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
      window.clearTimeout(timeout);
      window.removeEventListener(BOOKMARKS_REQUEST_EVENT, listener);
      resolve((event as CustomEvent<BookmarksRequestParams>).detail);
    };

    window.addEventListener(BOOKMARKS_REQUEST_EVENT, listener);
  });
}

async function fetchBookmarksPage(
  params: BookmarksRequestParams,
  cursor: string,
): Promise<unknown> {
  const response = await fetch(buildBookmarksRequestUrl(params, cursor), {
    credentials: 'include',
    headers: params.headers,
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after'));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 15_000;
    await sleep(waitMs);
    return fetchBookmarksPage(params, cursor);
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

    if (reachedSyncWatermark) {
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
          captureWatermark &&
          (reachedSyncWatermark ||
            isOlderThanWatermark(
              normalizeBookmarksResponse(
                body as Parameters<typeof normalizeBookmarksResponse>[0],
              ),
              captureWatermark,
            ))
        ) {
          break;
        }
      } catch {
        break;
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
