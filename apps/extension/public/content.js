"use strict";
(() => {
  // src/messages.ts
  function isExtensionMessage(value) {
    if (typeof value !== "object" || value === null || !("type" in value)) {
      return false;
    }
    const message = value;
    return message.type === "shots-captured" || message.type === "get-captured-shots" || message.type === "sync-now";
  }

  // src/content.ts
  var capturedShots = [];
  function normalizeBookmarksResponse(body) {
    const instructions = body.data?.bookmark_timeline_v2?.timeline?.instructions ?? [];
    const shots = [];
    for (const instruction of instructions) {
      for (const entry of instruction.entries ?? []) {
        const tweet = entry.content?.itemContent?.tweet_results?.result;
        if (!tweet?.rest_id || !tweet.legacy) {
          continue;
        }
        const legacy = tweet.legacy;
        if (!legacy) {
          continue;
        }
        const media = legacy.extended_entities?.media ?? legacy.entities?.media ?? [];
        const photos = media.filter((item) => item.type === "photo");
        photos.forEach((photo, index) => {
          if (!photo.media_url_https) {
            return;
          }
          const handle = tweet.core?.user_results?.result?.legacy?.screen_name ?? "unknown";
          shots.push({
            authorHandle: handle,
            authorName: tweet.core?.user_results?.result?.legacy?.name,
            bookmarkedAt: new Date(legacy.created_at ?? Date.now()).toISOString(),
            caption: legacy.full_text,
            imageIndex: index,
            imageUrl: `${photo.media_url_https}?name=large`,
            xPostId: tweet.rest_id
          });
        });
      }
    }
    return shots;
  }
  var originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = args[0];
    const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (requestUrl.includes("Bookmarks")) {
      response.clone().json().then((body) => {
        const shots = normalizeBookmarksResponse(body);
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
      }).catch(() => void 0);
    }
    return response;
  };
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isExtensionMessage(message) && message.type === "get-captured-shots") {
      sendResponse({ shots: capturedShots });
    }
  });
})();
