import { BOOKMARKS_RESPONSE_EVENT } from './constants.js';

function isBookmarksApiUrl(requestUrl: string): boolean {
  return (
    /\/Bookmarks(?:\?|$)/i.test(requestUrl) ||
    /BookmarkSearchTimeline/i.test(requestUrl)
  );
}

function emitBookmarksBody(body: unknown): void {
  window.dispatchEvent(
    new CustomEvent(BOOKMARKS_RESPONSE_EVENT, { detail: body }),
  );
}

function patchFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = args[0];
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (isBookmarksApiUrl(requestUrl)) {
      void response
        .clone()
        .json()
        .then((body) => {
          emitBookmarksBody(body);
        })
        .catch(() => undefined);
    }

    return response;
  };
}

function patchXhr(): void {
  const OriginalXHR = window.XMLHttpRequest;

  window.XMLHttpRequest = function PatchedXMLHttpRequest(
    this: XMLHttpRequest,
  ) {
    const xhr = new OriginalXHR();
    let requestUrl = '';

    const originalOpen = xhr.open.bind(xhr);
    xhr.open = function open(
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ) {
      requestUrl = typeof url === 'string' ? url : url.toString();
      return originalOpen(method, url, async ?? true, username, password);
    };

    xhr.addEventListener('load', () => {
      if (!isBookmarksApiUrl(requestUrl)) {
        return;
      }

      if (xhr.responseType && xhr.responseType !== 'text') {
        return;
      }

      try {
        emitBookmarksBody(JSON.parse(xhr.responseText));
      } catch {
        // Ignore malformed bookmark payloads.
      }
    });

    return xhr;
  } as unknown as typeof XMLHttpRequest;

  window.XMLHttpRequest.prototype = OriginalXHR.prototype;
}

patchFetch();
patchXhr();
