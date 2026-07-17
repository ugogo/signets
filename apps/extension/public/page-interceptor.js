"use strict";
(() => {
  // src/constants.ts
  var BOOKMARKS_RESPONSE_EVENT = "signets-bookmarks-response";

  // src/page-interceptor.ts
  function isBookmarksApiUrl(requestUrl) {
    return /\/Bookmarks(?:\?|$)/i.test(requestUrl) || /BookmarkSearchTimeline/i.test(requestUrl);
  }
  function emitBookmarksBody(body) {
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_RESPONSE_EVENT, { detail: body })
    );
  }
  function patchFetch() {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const input = args[0];
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (isBookmarksApiUrl(requestUrl)) {
        void response.clone().json().then((body) => {
          emitBookmarksBody(body);
        }).catch(() => void 0);
      }
      return response;
    };
  }
  function patchXhr() {
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function PatchedXMLHttpRequest() {
      const xhr = new OriginalXHR();
      let requestUrl = "";
      const originalOpen = xhr.open.bind(xhr);
      xhr.open = function open(method, url, async, username, password) {
        requestUrl = typeof url === "string" ? url : url.toString();
        return originalOpen(method, url, async ?? true, username, password);
      };
      xhr.addEventListener("load", () => {
        if (!isBookmarksApiUrl(requestUrl)) {
          return;
        }
        if (xhr.responseType && xhr.responseType !== "text") {
          return;
        }
        try {
          emitBookmarksBody(JSON.parse(xhr.responseText));
        } catch {
        }
      });
      return xhr;
    };
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
  }
  patchFetch();
  patchXhr();
})();
