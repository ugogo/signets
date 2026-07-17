import type { SyncResult } from '@signets/shared';

import { isExtensionMessage, isGetCapturedShotsResponse } from './messages.js';

type Settings = {
  apiUrl: string;
  syncToken: string;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message) || message.type !== 'sync-now') {
    return;
  }

  void (async () => {
    const settings = await loadSettings();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) {
      sendResponse({ error: 'Open your X bookmarks tab first.', ok: false });
      return;
    }

    const captured: unknown = await chrome.tabs.sendMessage(tab.id, {
      type: 'get-captured-shots',
    });
    const shots = isGetCapturedShotsResponse(captured) ? captured.shots : [];

    if (shots.length === 0) {
      sendResponse({
        error: 'No shots captured yet. Scroll your bookmarks page, then retry.',
        ok: false,
      });
      return;
    }

    const response = await fetch(`${settings.apiUrl}/sync`, {
      body: JSON.stringify({ shots } satisfies { shots: unknown[] }),
      headers: {
        Authorization: `Bearer ${settings.syncToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      sendResponse({ error: `Sync failed (${response.status})`, ok: false });
      return;
    }

    const result = (await response.json()) as SyncResult;
    sendResponse({ captured: shots.length, ok: true, result });
  })();

  return true;
});

async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(['apiUrl', 'syncToken']);
  return {
    apiUrl:
      typeof stored.apiUrl === 'string'
        ? stored.apiUrl
        : 'http://localhost:3001',
    syncToken: typeof stored.syncToken === 'string' ? stored.syncToken : '',
  };
}

export {};
