import { isSyncNowResponse } from './messages.js';

const apiUrlInput = document.querySelector<HTMLInputElement>('#apiUrl')!;
const syncTokenInput = document.querySelector<HTMLInputElement>('#syncToken')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

document.querySelector('#save')!.addEventListener('click', () => {
  void (async () => {
    await chrome.storage.sync.set({
      apiUrl: apiUrlInput.value,
      syncToken: syncTokenInput.value,
    });
    status.textContent = 'Settings saved.';
  })();
});

document.querySelector('#sync')!.addEventListener('click', () => {
  status.textContent = 'Syncing…';
  chrome.runtime.sendMessage({ type: 'sync-now' }, (response) => {
    if (!isSyncNowResponse(response) || !response.ok) {
      status.textContent =
        isSyncNowResponse(response) && !response.ok
          ? response.error
          : 'Sync failed.';
      return;
    }

    status.textContent = `Synced ${response.result.upserted} shots (${response.captured} captured).`;
  });
});

void chrome.storage.sync.get(['apiUrl', 'syncToken']).then((stored) => {
  if (typeof stored.apiUrl === 'string') {
    apiUrlInput.value = stored.apiUrl;
  }
  if (typeof stored.syncToken === 'string') {
    syncTokenInput.value = stored.syncToken;
  }
});
