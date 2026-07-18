import type { SyncShotInput } from '@signets/shared';

import {
  buildBookmarksRequestUrl,
  extractBottomCursor,
  type BookmarksRequestParams,
} from './bookmarks-api.js';
import { countTimelineEntries, normalizeBookmarksResponse } from './bookmarks-parser.js';
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
const PAGE_FETCH_DELAY_MS = 600;
const REQUEST_PARAMS_TIMEOUT_MS = 20_000;

let captureAborted = false;
let bookmarksResponseSeen = false;
let lastBottomCursor: string | undefined;
let capturedRequestParams: BookmarksRequestParams | undefined;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addCapturedShots(shots: SyncShotInput[]): void {
  for (const shot of shots) {
    const key = `${shot.xPostId}:${shot.imageIndex}`;
    if (
      !capturedShots.some(
        (existing) => `${existing.xPostId}:${existing.imageIndex}` === key,
      )
    ) {
      capturedShots.push(shot);
    }
  }

  updateSyncOverlay(capturedShots.length);

  void chrome.runtime.sendMessage({
    count: capturedShots.length,
    type: 'shots-captured',
  });
}

function processBookmarksBody(body: unknown): void {
  bookmarksResponseSeen = true;
  let parsed = 0;
  let entries = 0;

  try {
    const typedBody = body as Parameters<typeof normalizeBookmarksResponse>[0];
    entries = countTimelineEntries(typedBody);
    const shots = normalizeBookmarksResponse(typedBody);
    parsed = shots.length;
    lastBottomCursor = extractBottomCursor(typedBody);
    if (shots.length > 0) {
      addCapturedShots(shots);
    }
  } catch {
    // Ignore malformed bookmark payloads.
  }

  void chrome.runtime.sendMessage({
    entries,
    parsed,
    total: capturedShots.length,
    type: 'bookmarks-intercepted',
  });
}

window.addEventListener(BOOKMARKS_RESPONSE_EVENT, (event) => {
  processBookmarksBody((event as CustomEvent).detail);
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

async function captureAllBookmarks(): Promise<{ count: number; stopped: boolean }> {
  captureAborted = false;
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

    let cursor = lastBottomCursor;
    let idlePages = 0;

    while (!captureAborted && idlePages < 3 && cursor) {
      const beforeCount = capturedShots.length;
      const previousCursor = cursor;

      try {
        const body = await fetchBookmarksPage(params, cursor);
        processBookmarksBody(body);
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
    capturedShots.length = 0;
    bookmarksResponseSeen = false;
    lastBottomCursor = undefined;
    capturedRequestParams = undefined;
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
    void captureAllBookmarks().then((result) => {
      sendResponse(result);
    });
    return true;
  }

  return;
});
