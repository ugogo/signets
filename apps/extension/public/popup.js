"use strict";
(() => {
  // src/messages.ts
  function isSyncNowResponse(value) {
    if (typeof value !== "object" || value === null || !("ok" in value)) {
      return false;
    }
    const response = value;
    if (response.ok) {
      return typeof response.captured === "number" && typeof response.result === "object" && response.result !== null && "upserted" in response.result;
    }
    return typeof response.error === "string";
  }

  // src/popup.ts
  var apiUrlInput = document.querySelector("#apiUrl");
  var syncTokenInput = document.querySelector("#syncToken");
  var status = document.querySelector("#status");
  document.querySelector("#save").addEventListener("click", () => {
    void (async () => {
      await chrome.storage.sync.set({
        apiUrl: apiUrlInput.value,
        syncToken: syncTokenInput.value
      });
      status.textContent = "Settings saved.";
    })();
  });
  document.querySelector("#sync").addEventListener("click", () => {
    status.textContent = "Syncing\u2026";
    chrome.runtime.sendMessage({ type: "sync-now" }, (response) => {
      if (!isSyncNowResponse(response) || !response.ok) {
        status.textContent = isSyncNowResponse(response) && !response.ok ? response.error : "Sync failed.";
        return;
      }
      status.textContent = `Synced ${response.result.upserted} shots (${response.captured} captured).`;
    });
  });
  void chrome.storage.sync.get(["apiUrl", "syncToken"]).then((stored) => {
    if (typeof stored.apiUrl === "string") {
      apiUrlInput.value = stored.apiUrl;
    }
    if (typeof stored.syncToken === "string") {
      syncTokenInput.value = stored.syncToken;
    }
  });
})();
