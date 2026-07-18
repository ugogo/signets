"use strict";
(() => {
  // src/bookmarks-api.ts
  var BOOKMARKS_PAGE_SIZE = 100;
  function buildBookmarksRequestUrl(params, cursor) {
    const variables = {
      ...params.variables,
      count: BOOKMARKS_PAGE_SIZE
    };
    if (cursor) {
      variables.cursor = cursor;
    } else {
      delete variables.cursor;
    }
    const url = new URL(
      `https://x.com/i/api/graphql/${params.queryId}/${params.operation}`
    );
    url.searchParams.set("variables", JSON.stringify(variables));
    url.searchParams.set("features", JSON.stringify(params.features));
    return url.toString();
  }
  function extractBottomCursor(body) {
    const timelineBody = body;
    const instructions = timelineBody.data?.bookmark_timeline_v2?.timeline?.instructions ?? timelineBody.data?.search_by_raw_query?.bookmarks_search_timeline?.timeline?.instructions ?? [];
    for (const instruction of instructions) {
      if (instruction.type !== "TimelineAddEntries") {
        continue;
      }
      for (const entry of instruction.entries ?? []) {
        if (entry.entryId?.startsWith("cursor-bottom") && typeof entry.content?.value === "string" && entry.content.value.length > 0) {
          return entry.content.value;
        }
      }
    }
    return void 0;
  }

  // src/bookmarks-parser.ts
  function isPhotoMedia(item) {
    if (!item.media_url_https) {
      return false;
    }
    if (!item.type || item.type === "photo") {
      return true;
    }
    return item.type !== "video" && item.type !== "animated_gif";
  }
  function extractAuthor(user) {
    const legacy = user?.legacy ?? void 0;
    const core = user?.core ?? void 0;
    const handle = core?.screen_name || legacy?.screen_name || "unknown";
    const name = core?.name || legacy?.name;
    return { handle, name };
  }
  function unwrapTweet(result) {
    if (!result) {
      return void 0;
    }
    const candidate = result.__typename === "TweetWithVisibilityResults" && result.tweet ? result.tweet : result.tweet?.rest_id ? result.tweet : result;
    if (candidate.rest_id && candidate.legacy) {
      return candidate;
    }
    return void 0;
  }
  function getTimelineInstructions(body) {
    const bookmarkTimeline = body.data?.bookmark_timeline_v2?.timeline?.instructions;
    if (bookmarkTimeline?.length) {
      return bookmarkTimeline;
    }
    const searchTimeline = body.data?.search_by_raw_query?.bookmarks_search_timeline?.timeline?.instructions;
    if (searchTimeline?.length) {
      return searchTimeline;
    }
    return [];
  }
  function collectTimelineEntries(body) {
    const entries = [];
    const seen = /* @__PURE__ */ new Set();
    const visit = (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          visit(item);
        }
        return;
      }
      const record = node;
      const content = record.content;
      if (content && typeof content === "object" && "itemContent" in content && content?.itemContent?.tweet_results) {
        const entry = record;
        if (!seen.has(entry)) {
          seen.add(entry);
          entries.push(entry);
        }
      }
      for (const value of Object.values(record)) {
        visit(value);
      }
    };
    visit(body);
    return entries;
  }
  function tweetToShots(tweet) {
    const legacy = tweet.legacy;
    if (!tweet.rest_id || !legacy) {
      return [];
    }
    const media = legacy.extended_entities?.media ?? legacy.entities?.media ?? [];
    const photos = media.filter(isPhotoMedia);
    const caption = tweet.note_tweet?.note_tweet_results?.result?.text ?? legacy.full_text;
    const author = extractAuthor(tweet.core?.user_results?.result);
    return photos.flatMap((photo, index) => {
      if (!photo.media_url_https) {
        return [];
      }
      return [
        {
          authorHandle: author.handle,
          authorName: author.name,
          bookmarkedAt: new Date(legacy.created_at ?? Date.now()).toISOString(),
          caption,
          imageIndex: index,
          imageUrl: `${photo.media_url_https}?name=large`,
          xPostId: tweet.rest_id
        }
      ];
    });
  }
  function shotsFromEntries(entries) {
    const shots = [];
    for (const entry of entries) {
      if (entry.content?.entryType && entry.content.entryType !== "TimelineTimelineItem") {
        continue;
      }
      const tweet = unwrapTweet(
        entry.content?.itemContent?.tweet_results?.result
      );
      if (!tweet) {
        continue;
      }
      shots.push(...tweetToShots(tweet));
    }
    return shots;
  }
  function normalizeBookmarksResponse(body) {
    const instructions = getTimelineInstructions(body);
    const instructionEntries = instructions.flatMap(
      (instruction) => instruction.entries ?? []
    );
    const entries = instructionEntries.length > 0 ? instructionEntries : collectTimelineEntries(body);
    return shotsFromEntries(entries);
  }
  function countTimelineEntries(body) {
    const instructions = getTimelineInstructions(body);
    const instructionEntries = instructions.flatMap(
      (instruction) => instruction.entries ?? []
    );
    if (instructionEntries.length > 0) {
      return instructionEntries.length;
    }
    return collectTimelineEntries(body).length;
  }

  // src/constants.ts
  var BOOKMARKS_RESPONSE_EVENT = "signets-bookmarks-response";
  var BOOKMARKS_REQUEST_EVENT = "signets-bookmarks-request";

  // src/messages.ts
  function isExtensionMessage(value) {
    if (typeof value !== "object" || value === null || !("type" in value)) {
      return false;
    }
    const message = value;
    return message.type === "shots-captured" || message.type === "bookmarks-intercepted" || message.type === "clear-captured-shots" || message.type === "clear-logs" || message.type === "dry-run" || message.type === "get-captured-shots" || message.type === "get-logs" || message.type === "get-sync-state" || message.type === "start-auto-scroll" || message.type === "stop-auto-scroll" || message.type === "stop-sync" || message.type === "sync-now";
  }

  // src/content.ts
  var capturedShots = [];
  var PAGE_FETCH_DELAY_MS = 600;
  var REQUEST_PARAMS_TIMEOUT_MS = 2e4;
  var captureAborted = false;
  var bookmarksResponseSeen = false;
  var lastBottomCursor;
  var capturedRequestParams;
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function addCapturedShots(shots) {
    for (const shot of shots) {
      const key = `${shot.xPostId}:${shot.imageIndex}`;
      if (!capturedShots.some(
        (existing) => `${existing.xPostId}:${existing.imageIndex}` === key
      )) {
        capturedShots.push(shot);
      }
    }
    void chrome.runtime.sendMessage({
      count: capturedShots.length,
      type: "shots-captured"
    });
  }
  function processBookmarksBody(body) {
    bookmarksResponseSeen = true;
    let parsed = 0;
    let entries = 0;
    try {
      const typedBody = body;
      entries = countTimelineEntries(typedBody);
      const shots = normalizeBookmarksResponse(typedBody);
      parsed = shots.length;
      lastBottomCursor = extractBottomCursor(typedBody);
      if (shots.length > 0) {
        addCapturedShots(shots);
      }
    } catch {
    }
    void chrome.runtime.sendMessage({
      entries,
      parsed,
      total: capturedShots.length,
      type: "bookmarks-intercepted"
    });
  }
  window.addEventListener(BOOKMARKS_RESPONSE_EVENT, (event) => {
    processBookmarksBody(event.detail);
  });
  window.addEventListener(BOOKMARKS_REQUEST_EVENT, (event) => {
    capturedRequestParams = event.detail;
  });
  function waitForRequestParams(timeoutMs) {
    if (capturedRequestParams) {
      return Promise.resolve(capturedRequestParams);
    }
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener(
          BOOKMARKS_REQUEST_EVENT,
          listener
        );
        reject(new Error("Timed out waiting for bookmarks API request."));
      }, timeoutMs);
      const listener = (event) => {
        window.clearTimeout(timeout);
        window.removeEventListener(BOOKMARKS_REQUEST_EVENT, listener);
        resolve(event.detail);
      };
      window.addEventListener(BOOKMARKS_REQUEST_EVENT, listener);
    });
  }
  async function fetchBookmarksPage(params, cursor) {
    const response = await fetch(buildBookmarksRequestUrl(params, cursor), {
      credentials: "include",
      headers: params.headers
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1e3 : 15e3;
      await sleep(waitMs);
      return fetchBookmarksPage(params, cursor);
    }
    if (!response.ok) {
      throw new Error(`Bookmarks API returned ${response.status}.`);
    }
    return response.json();
  }
  async function captureAllBookmarks() {
    captureAborted = false;
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
      if (capturedShots.length === beforeCount || !cursor || cursor === previousCursor) {
        idlePages += 1;
      } else {
        idlePages = 0;
      }
      await sleep(PAGE_FETCH_DELAY_MS);
    }
    return { count: capturedShots.length, stopped: captureAborted };
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isExtensionMessage(message)) {
      return;
    }
    if (message.type === "clear-captured-shots") {
      capturedShots.length = 0;
      bookmarksResponseSeen = false;
      lastBottomCursor = void 0;
      capturedRequestParams = void 0;
      sendResponse({ ok: true });
      return;
    }
    if (message.type === "get-captured-shots") {
      sendResponse({ shots: capturedShots });
      return;
    }
    if (message.type === "stop-auto-scroll") {
      captureAborted = true;
      sendResponse({ ok: true });
      return;
    }
    if (message.type === "start-auto-scroll") {
      void captureAllBookmarks().then((result) => {
        sendResponse(result);
      });
      return true;
    }
    return;
  });
})();
