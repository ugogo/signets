"use strict";
(() => {
  // src/bookmarks-api.ts
  function parseBookmarksRequestUrl(requestUrl) {
    let parsed;
    try {
      parsed = new URL(requestUrl, "https://x.com");
    } catch {
      return null;
    }
    const match = parsed.pathname.match(/\/i\/api\/graphql\/([^/]+)\/([^/]+)/i);
    if (!match) {
      return null;
    }
    const variablesRaw = parsed.searchParams.get("variables");
    const featuresRaw = parsed.searchParams.get("features");
    if (!variablesRaw || !featuresRaw) {
      return null;
    }
    try {
      return {
        features: JSON.parse(featuresRaw),
        operation: match[2],
        queryId: match[1],
        variables: JSON.parse(variablesRaw)
      };
    } catch {
      return null;
    }
  }

  // src/constants.ts
  var BOOKMARKS_RESPONSE_EVENT = "signets-bookmarks-response";
  var BOOKMARKS_REQUEST_EVENT = "signets-bookmarks-request";

  // src/page-interceptor.ts
  function isBookmarksApiUrl(requestUrl) {
    return /\/Bookmarks(?:\?|$)/i.test(requestUrl) || /BookmarkSearchTimeline/i.test(requestUrl);
  }
  function resolveRequestUrl(input) {
    if (typeof input === "string") {
      return input;
    }
    if (input instanceof URL) {
      return input.toString();
    }
    return input.url;
  }
  function collectFetchHeaders(input, init) {
    const headers = new Headers();
    if (input instanceof Request) {
      input.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    }
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }
    const result = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  function emitBookmarksRequest(requestUrl, headers) {
    const parsed = parseBookmarksRequestUrl(requestUrl);
    if (!parsed) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_REQUEST_EVENT, {
        detail: {
          ...parsed,
          headers
        }
      })
    );
  }
  function emitBookmarksBody(body) {
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_RESPONSE_EVENT, { detail: body })
    );
  }
  function patchFetch() {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const requestUrl = resolveRequestUrl(input);
      if (isBookmarksApiUrl(requestUrl)) {
        emitBookmarksRequest(requestUrl, collectFetchHeaders(input, init));
      }
      const response = await originalFetch(input, init);
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
      const requestHeaders = {};
      const originalOpen = xhr.open.bind(xhr);
      xhr.open = function open(method, url, async, username, password) {
        requestUrl = typeof url === "string" ? url : url.toString();
        return originalOpen(method, url, async ?? true, username, password);
      };
      const originalSetRequestHeader = xhr.setRequestHeader.bind(xhr);
      xhr.setRequestHeader = function setRequestHeader(name, value) {
        requestHeaders[name] = value;
        return originalSetRequestHeader(name, value);
      };
      xhr.addEventListener("load", () => {
        if (!isBookmarksApiUrl(requestUrl)) {
          return;
        }
        emitBookmarksRequest(requestUrl, requestHeaders);
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
