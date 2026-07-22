import { parseBookmarksRequestUrl } from './bookmarks-api.js';
import {
  BOOKMARKS_REQUEST_EVENT,
  BOOKMARKS_RESPONSE_EVENT,
} from './constants.js';

export function installPageInterceptor(bridgeSecret: string): void {
  if (!bridgeSecret) {
    return;
  }

  function emitBookmarksRequest(
    requestUrl: string,
    headers: Record<string, string>,
  ): void {
    const parsed = parseBookmarksRequestUrl(requestUrl);
    if (!parsed) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_REQUEST_EVENT, {
        detail: {
          bridgeSecret,
          headers,
          ...parsed,
        },
      }),
    );
  }

  function emitBookmarksBody(body: unknown): void {
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_RESPONSE_EVENT, {
        detail: {
          body,
          bridgeSecret,
        },
      }),
    );
  }

  function patchFetch(): void {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const requestUrl = resolveRequestUrl(input);

      if (isBookmarksApiUrl(requestUrl)) {
        emitBookmarksRequest(requestUrl, collectFetchHeaders(input, init));
      }

      const response = await originalFetch(input, init);

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
      const requestHeaders: Record<string, string> = {};

      const originalOpen = xhr.open.bind(xhr);
      xhr.open = function open(
        method: string,
        url: string | URL,
        async?: boolean,
        username?: null | string,
        password?: null | string,
      ) {
        requestUrl = typeof url === 'string' ? url : url.toString();
        return originalOpen(method, url, async ?? true, username, password);
      };

      const originalSetRequestHeader = xhr.setRequestHeader.bind(xhr);
      xhr.setRequestHeader = function setRequestHeader(
        name: string,
        value: string,
      ) {
        requestHeaders[name] = value;
        return originalSetRequestHeader(name, value);
      };

      xhr.addEventListener('load', () => {
        if (!isBookmarksApiUrl(requestUrl)) {
          return;
        }

        emitBookmarksRequest(requestUrl, requestHeaders);

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
}

function collectFetchHeaders(
  input: RequestInfo | URL,
  init?: RequestInit,
): Record<string, string> {
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

  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function isBookmarksApiUrl(requestUrl: string): boolean {
  return (
    /\/Bookmarks(?:\?|$)/i.test(requestUrl) ||
    /BookmarkSearchTimeline/i.test(requestUrl)
  );
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
