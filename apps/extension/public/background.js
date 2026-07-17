// src/constants.ts
var API_URLS = {
  dev: "http://localhost:3001",
  prod: "https://signets-api.onrender.com"
};
var BOOKMARKS_URL = "https://x.com/i/bookmarks";
var SYNC_BATCH_SIZE = 50;

// src/log.ts
var MAX_LOG_ENTRIES = 100;
var logs = [];
function appendLog(level, message) {
  logs.push({ level, message, timestamp: Date.now() });
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.shift();
  }
  void chrome.runtime.sendMessage({ logs: [...logs], type: "log-updated" }).catch(
    () => void 0
  );
}
function getLogs() {
  return [...logs];
}
function clearLogs() {
  logs.length = 0;
  void chrome.runtime.sendMessage({ logs: [], type: "log-updated" }).catch(
    () => void 0
  );
}

// src/messages.ts
function isExtensionMessage(value) {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  const message = value;
  return message.type === "shots-captured" || message.type === "bookmarks-intercepted" || message.type === "clear-captured-shots" || message.type === "clear-logs" || message.type === "dry-run" || message.type === "get-captured-shots" || message.type === "get-logs" || message.type === "get-sync-state" || message.type === "start-auto-scroll" || message.type === "stop-auto-scroll" || message.type === "stop-sync" || message.type === "sync-now";
}
function isGetCapturedShotsResponse(value) {
  return typeof value === "object" && value !== null && "shots" in value && Array.isArray(value.shots);
}
function isAutoScrollResponse(value) {
  return typeof value === "object" && value !== null && "count" in value && typeof value.count === "number" && "stopped" in value && typeof value.stopped === "boolean";
}

// src/settings.ts
function normalizeSyncToken(token) {
  return token.trim().replace(/^Bearer\s+/i, "");
}
async function loadSettings() {
  const stored = await chrome.storage.sync.get(["apiEnv", "apiUrl", "syncToken"]);
  const apiEnv = stored.apiEnv === "dev" ? "dev" : "prod";
  const apiUrl = apiEnv === "prod" ? API_URLS.prod : typeof stored.apiUrl === "string" ? stored.apiUrl : API_URLS.dev;
  return {
    apiUrl,
    syncToken: typeof stored.syncToken === "string" ? normalizeSyncToken(stored.syncToken) : ""
  };
}

// src/sync-client.ts
var SyncRequestError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "SyncRequestError";
  }
};
function authHeaders(syncToken) {
  return {
    Authorization: `Bearer ${syncToken}`
  };
}
async function readErrorMessage(response) {
  try {
    const body = await response.json();
    const message = body.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (Array.isArray(message)) {
      return message.map(String).join(", ");
    }
    if (message && typeof message === "object") {
      return JSON.stringify(message);
    }
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
  }
  return void 0;
}
function formatSyncFailure(status, apiUrl, detail) {
  if (status === 401) {
    return `Invalid sync token (HTTP 401) for ${apiUrl}. Use the exact SYNC_TOKEN from apps/api/.env (no "Bearer " prefix), save settings, then retry.`;
  }
  if (status === 413) {
    return `Request payload too large (HTTP 413) for ${apiUrl}. Try syncing again \u2014 uploads are batched automatically.`;
  }
  if (status === 429) {
    return `Rate limited (HTTP 429) by ${apiUrl}. Wait a minute and retry.`;
  }
  const suffix = detail ? `: ${detail}` : "";
  return `API request failed (HTTP ${status}) at ${apiUrl}${suffix}`;
}
function formatNetworkError(error, apiUrl, action) {
  if (error instanceof TypeError) {
    return `Could not reach the API at ${apiUrl} while ${action}. Is the dev server running? Start it with pnpm --filter @signets/api dev.`;
  }
  if (error instanceof Error) {
    return `${action} failed: ${error.message}`;
  }
  return `${action} failed unexpectedly.`;
}
async function requestSync(settings, path, init, action) {
  try {
    return await fetch(`${settings.apiUrl}${path}`, init);
  } catch (error) {
    throw new SyncRequestError(formatNetworkError(error, settings.apiUrl, action), 0);
  }
}
async function verifySyncCredentials(settings) {
  const response = await requestSync(
    settings,
    "/sync/verify",
    { headers: authHeaders(settings.syncToken) },
    "verifying the sync token"
  );
  if (response.status === 404) {
    return;
  }
  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SyncRequestError(
      formatSyncFailure(response.status, settings.apiUrl, detail),
      response.status
    );
  }
}
async function uploadSyncBatch(settings, shots) {
  const response = await requestSync(
    settings,
    "/sync",
    {
      body: JSON.stringify({ shots }),
      headers: {
        ...authHeaders(settings.syncToken),
        "Content-Type": "application/json"
      },
      method: "POST"
    },
    "uploading shots"
  );
  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SyncRequestError(
      formatSyncFailure(response.status, settings.apiUrl, detail),
      response.status
    );
  }
  return await response.json();
}

// src/background.ts
var syncState = "idle";
var activeSyncTabId;
var stopRequested = false;
var syncInProgress = false;
function setSyncState(state) {
  syncState = state;
  void chrome.runtime.sendMessage({ state, type: "sync-state-changed" }).catch(
    () => void 0
  );
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isBookmarksUrl(url) {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (parsed.hostname === "x.com" || parsed.hostname === "twitter.com") && parsed.pathname.startsWith("/i/bookmarks");
  } catch {
    return false;
  }
}
async function waitForTabLoad(tabId, timeoutMs = 15e3) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.status === "complete") {
    return;
  }
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Bookmarks page load timed out."));
    }, timeoutMs);
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}
async function sendTabMessageWithRetry(tabId, message, retries = 5) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}
async function findOrOpenBookmarksTab() {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((tab) => isBookmarksUrl(tab.url));
  if (existing?.id) {
    appendLog("info", "Using existing bookmarks tab.");
    await chrome.tabs.update(existing.id, { active: true });
    return existing;
  }
  appendLog("info", "Opening bookmarks page\u2026");
  const created = await chrome.tabs.create({
    active: true,
    url: BOOKMARKS_URL
  });
  if (!created.id) {
    throw new Error("Could not open bookmarks tab.");
  }
  return created;
}
async function runAutoScroll(tabId) {
  activeSyncTabId = tabId;
  setSyncState("scrolling");
  const response = await sendTabMessageWithRetry(tabId, {
    type: "start-auto-scroll"
  });
  if (!isAutoScrollResponse(response)) {
    throw new Error("Auto-scroll did not return a valid response.");
  }
  return response;
}
async function getCapturedShots(tabId) {
  const captured = await chrome.tabs.sendMessage(tabId, {
    type: "get-captured-shots"
  });
  return isGetCapturedShotsResponse(captured) ? captured.shots : [];
}
async function captureBookmarks(label) {
  appendLog("info", `${label}: opening bookmarks page\u2026`);
  const tab = await findOrOpenBookmarksTab();
  if (!tab.id) {
    throw new Error("Could not access bookmarks tab.");
  }
  await waitForTabLoad(tab.id);
  appendLog("info", "Reloading bookmarks page to capture fresh data\u2026");
  await chrome.tabs.reload(tab.id);
  await waitForTabLoad(tab.id);
  await sleep(1500);
  let scrollResult;
  try {
    scrollResult = await runAutoScroll(tab.id);
  } catch {
    appendLog(
      "error",
      "Could not connect to bookmarks page. Reload and retry."
    );
    throw new Error("Could not connect to bookmarks page. Reload and retry.");
  }
  if (scrollResult.stopped || stopRequested) {
    appendLog(
      "info",
      `Stopped by user \u2014 captured ${scrollResult.count} shots.`
    );
  } else {
    appendLog("info", `Capture complete: ${scrollResult.count} shots.`);
  }
  return { ...scrollResult, tabId: tab.id };
}
async function uploadShots(settings, tabId) {
  setSyncState("uploading");
  const shots = await getCapturedShots(tabId);
  if (shots.length === 0) {
    throw new Error("No photo shots found in bookmarks.");
  }
  const batches = chunkShots(shots, SYNC_BATCH_SIZE);
  appendLog(
    "info",
    `Uploading ${shots.length} shots in ${batches.length} batch${batches.length === 1 ? "" : "es"}\u2026`
  );
  let upserted = 0;
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    appendLog(
      "info",
      `Uploading batch ${index + 1}/${batches.length} (${batch.length} shots)\u2026`
    );
    try {
      const result = await uploadSyncBatch(settings, batch);
      upserted += result.upserted;
    } catch (error) {
      if (error instanceof SyncRequestError) {
        throw new SyncRequestError(
          `Upload failed on batch ${index + 1}/${batches.length} \u2014 ${error.message}`,
          error.status
        );
      }
      throw error;
    }
  }
  return { captured: shots.length, result: { upserted } };
}
function chunkShots(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}
async function runSync(sendResponse) {
  if (syncInProgress) {
    sendResponse({ error: "Sync already in progress.", ok: false });
    return;
  }
  syncInProgress = true;
  stopRequested = false;
  activeSyncTabId = void 0;
  try {
    appendLog("info", "Starting sync\u2026");
    const settings = await loadSettings();
    if (!settings.syncToken) {
      appendLog("error", "Sync token is missing. Save settings first.");
      sendResponse({ error: "Sync token is missing.", ok: false });
      return;
    }
    appendLog("info", "Verifying sync token\u2026");
    await verifySyncCredentials(settings);
    const capture = await captureBookmarks("Sync");
    if (capture.count === 0) {
      appendLog("warn", "No photo shots found in bookmarks.");
      sendResponse({
        error: "No photo shots found. Log into X and bookmark some photos.",
        ok: false
      });
      return;
    }
    const { captured, result } = await uploadShots(settings, capture.tabId);
    appendLog("success", `Synced ${result.upserted} shots (${captured} captured).`);
    sendResponse({ captured, ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed unexpectedly.";
    appendLog("error", message);
    sendResponse({ error: message, ok: false });
  } finally {
    syncInProgress = false;
    stopRequested = false;
    activeSyncTabId = void 0;
    setSyncState("idle");
  }
}
async function runDryRun(sendResponse) {
  if (syncInProgress) {
    sendResponse({ error: "Sync already in progress.", ok: false });
    return;
  }
  syncInProgress = true;
  stopRequested = false;
  activeSyncTabId = void 0;
  try {
    appendLog("info", "Starting dry run (no upload)\u2026");
    const capture = await captureBookmarks("Dry run");
    const shots = await getCapturedShots(capture.tabId);
    if (shots.length === 0) {
      appendLog("warn", "No photo shots found in bookmarks.");
      sendResponse({
        error: "No photo shots found. Log into X and bookmark some photos.",
        ok: false
      });
      return;
    }
    appendLog("success", `Dry run complete: ${shots.length} shots ready to sync.`);
    sendResponse({
      captured: shots.length,
      ok: true,
      payload: { shots }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dry run failed unexpectedly.";
    appendLog("error", message);
    sendResponse({ error: message, ok: false });
  } finally {
    syncInProgress = false;
    stopRequested = false;
    activeSyncTabId = void 0;
    setSyncState("idle");
  }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    return;
  }
  if (message.type === "get-logs") {
    sendResponse({ logs: getLogs() });
    return;
  }
  if (message.type === "clear-logs") {
    clearLogs();
    sendResponse({ ok: true });
    return;
  }
  if (message.type === "get-sync-state") {
    sendResponse({ state: syncState });
    return;
  }
  if (message.type === "bookmarks-intercepted") {
    appendLog(
      "info",
      `Intercepted bookmarks API (${message.entries} entries, ${message.parsed} photos, ${message.total} total).`
    );
    return;
  }
  if (message.type === "shots-captured") {
    appendLog("info", `Scrolling\u2026 ${message.count} shots captured.`);
    return;
  }
  if (message.type === "stop-sync") {
    if (!syncInProgress || syncState !== "scrolling" || !activeSyncTabId) {
      sendResponse({ ok: false });
      return;
    }
    stopRequested = true;
    appendLog("info", "Stop requested\u2026");
    void chrome.tabs.sendMessage(activeSyncTabId, { type: "stop-auto-scroll" }).catch(() => void 0);
    sendResponse({ ok: true });
    return;
  }
  if (message.type === "dry-run") {
    void runDryRun(sendResponse);
    return true;
  }
  if (message.type === "sync-now") {
    void runSync(sendResponse);
    return true;
  }
  return;
});
