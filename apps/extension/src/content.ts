import type { SyncShotInput } from '@signets/shared';

import { countTimelineEntries, normalizeBookmarksResponse } from './bookmarks-parser.js';
import { BOOKMARKS_RESPONSE_EVENT } from './constants.js';
import { isExtensionMessage } from './messages.js';

const capturedShots: SyncShotInput[] = [];
let scrollAborted = false;
let bookmarksResponseSeen = false;

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

async function autoScrollCapture(): Promise<{ count: number; stopped: boolean }> {
  scrollAborted = false;
  bookmarksResponseSeen = false;
  let lastCount = 0;
  let idleRounds = 0;
  let waitedForInitialResponse = 0;

  while (idleRounds < 3 && !scrollAborted) {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(1500);

    if (scrollAborted) {
      break;
    }

    if (!bookmarksResponseSeen && waitedForInitialResponse < 4) {
      waitedForInitialResponse += 1;
      continue;
    }

    if (capturedShots.length === lastCount) {
      idleRounds += 1;
    } else {
      idleRounds = 0;
      lastCount = capturedShots.length;
    }
  }

  return { count: capturedShots.length, stopped: scrollAborted };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    return;
  }

  if (message.type === 'clear-captured-shots') {
    capturedShots.length = 0;
    bookmarksResponseSeen = false;
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'get-captured-shots') {
    sendResponse({ shots: capturedShots });
    return;
  }

  if (message.type === 'stop-auto-scroll') {
    scrollAborted = true;
    sendResponse({ ok: true });
    return;
  }

  if (message.type === 'start-auto-scroll') {
    void autoScrollCapture().then((result) => {
      sendResponse(result);
    });
    return true;
  }

  return;
});
