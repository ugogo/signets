// src/messages.ts
function isExtensionMessage(value) {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  const message = value;
  return message.type === "shots-captured" || message.type === "get-captured-shots" || message.type === "sync-now";
}
function isGetCapturedShotsResponse(value) {
  return typeof value === "object" && value !== null && "shots" in value && Array.isArray(value.shots);
}

// src/background.ts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message) || message.type !== "sync-now") {
    return;
  }
  void (async () => {
    const settings = await loadSettings();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (!tab?.id) {
      sendResponse({ error: "Open your X bookmarks tab first.", ok: false });
      return;
    }
    const captured = await chrome.tabs.sendMessage(tab.id, {
      type: "get-captured-shots"
    });
    const shots = isGetCapturedShotsResponse(captured) ? captured.shots : [];
    if (shots.length === 0) {
      sendResponse({
        error: "No shots captured yet. Scroll your bookmarks page, then retry.",
        ok: false
      });
      return;
    }
    const response = await fetch(`${settings.apiUrl}/sync`, {
      body: JSON.stringify({ shots }),
      headers: {
        Authorization: `Bearer ${settings.syncToken}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    if (!response.ok) {
      sendResponse({ error: `Sync failed (${response.status})`, ok: false });
      return;
    }
    const result = await response.json();
    sendResponse({ captured: shots.length, ok: true, result });
  })();
  return true;
});
async function loadSettings() {
  const stored = await chrome.storage.sync.get(["apiUrl", "syncToken"]);
  return {
    apiUrl: typeof stored.apiUrl === "string" ? stored.apiUrl : "http://localhost:3001",
    syncToken: typeof stored.syncToken === "string" ? stored.syncToken : ""
  };
}
