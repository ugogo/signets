"use strict";
(() => {
  // src/messages.ts
  function isBackgroundBroadcast(value) {
    if (typeof value !== "object" || value === null || !("type" in value)) {
      return false;
    }
    const message = value;
    return message.type === "log-updated" || message.type === "sync-state-changed";
  }
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
  function isDryRunResponse(value) {
    if (typeof value !== "object" || value === null || !("ok" in value)) {
      return false;
    }
    const response = value;
    if (response.ok) {
      return typeof response.captured === "number" && typeof response.payload === "object" && response.payload !== null && Array.isArray(response.payload.shots);
    }
    return typeof response.error === "string";
  }
  function isSyncStateResponse(value) {
    return typeof value === "object" && value !== null && "state" in value && (value.state === "idle" || value.state === "scrolling" || value.state === "uploading");
  }

  // src/settings.ts
  function normalizeSyncToken(token) {
    return token.trim().replace(/^Bearer\s+/i, "");
  }

  // src/popup.ts
  var apiUrlInput = document.querySelector("#apiUrl");
  var apiUrlWrapper = document.querySelector("#apiUrlWrapper");
  var syncTokenInput = document.querySelector("#syncToken");
  var envProdButton = document.querySelector("#envProd");
  var envDevButton = document.querySelector("#envDev");
  var saveButton = document.querySelector("#save");
  var syncButton = document.querySelector("#sync");
  var dryRunButton = document.querySelector("#dryRun");
  var stopButton = document.querySelector("#stop");
  var status = document.querySelector("#status");
  var logSection = document.querySelector("#logSection");
  var logElement = document.querySelector("#log");
  var dryRunPreview = document.querySelector("#dryRunPreview");
  var dryRunPayload = document.querySelector("#dryRunPayload");
  var settingsSection = document.querySelector("#settingsSection");
  var settingsSummary = document.querySelector("#settingsSummary");
  var apiEnv = "prod";
  var operationActive = false;
  function setApiEnv(env) {
    apiEnv = env;
    const isDev = env === "dev";
    apiUrlWrapper.classList.toggle("hidden", !isDev);
    envProdButton.classList.toggle("active", !isDev);
    envDevButton.classList.toggle("active", isDev);
  }
  function setStatus(message, tone = "default") {
    status.textContent = message;
    status.classList.toggle("status-error", tone === "error");
    status.classList.toggle("status-success", tone === "success");
  }
  function updateSettingsSection(hasToken) {
    if (hasToken) {
      settingsSection.open = false;
      settingsSummary.textContent = "Settings \xB7 sync token saved";
      return;
    }
    settingsSection.open = true;
    settingsSummary.textContent = "Settings";
  }
  function formatLogTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  function renderLogs(logs) {
    if (logs.length === 0) {
      logElement.textContent = "No activity yet.";
      return;
    }
    logElement.innerHTML = logs.map((entry) => {
      const time = formatLogTime(entry.timestamp);
      return `<span class="log-${entry.level}">[${time}] ${entry.message}</span>`;
    }).join("\n");
    logElement.scrollTop = logElement.scrollHeight;
  }
  function updateSyncButtons(state) {
    const inProgress = state !== "idle";
    syncButton.classList.toggle("hidden", inProgress);
    dryRunButton.classList.toggle("hidden", inProgress);
    stopButton.classList.toggle("hidden", state !== "scrolling");
    syncButton.disabled = inProgress;
    dryRunButton.disabled = inProgress;
    saveButton.disabled = inProgress;
    if (inProgress) {
      logSection.open = true;
    }
  }
  function hideDryRunPreview() {
    dryRunPreview.classList.add("hidden");
    dryRunPreview.open = false;
    dryRunPayload.textContent = "";
  }
  function showDryRunPreview(payload) {
    dryRunPayload.textContent = JSON.stringify(payload, null, 2);
    dryRunPreview.classList.remove("hidden");
    dryRunPreview.open = true;
  }
  function loadLogs() {
    chrome.runtime.sendMessage({ type: "get-logs" }, (response) => {
      if (typeof response === "object" && response !== null && "logs" in response && Array.isArray(response.logs)) {
        renderLogs(response.logs);
      }
    });
  }
  function loadSyncState() {
    chrome.runtime.sendMessage({ type: "get-sync-state" }, (response) => {
      if (isSyncStateResponse(response)) {
        updateSyncButtons(response.state);
        if (response.state !== "idle" && operationActive) {
          setStatus(
            response.state === "uploading" ? "Uploading\u2026" : "Sync in progress\u2026"
          );
        }
      }
    });
  }
  function startCapture(options) {
    operationActive = true;
    setStatus(`${options.label}\u2026`);
    updateSyncButtons("scrolling");
    hideDryRunPreview();
    const begin = () => {
      chrome.runtime.sendMessage({ type: options.messageType }, (response) => {
        operationActive = false;
        updateSyncButtons("idle");
        options.onComplete(response);
        loadLogs();
      });
    };
    if (options.clearLogs) {
      chrome.runtime.sendMessage({ type: "clear-logs" }, () => {
        loadLogs();
        begin();
      });
      return;
    }
    begin();
  }
  envProdButton.addEventListener("click", () => {
    setApiEnv("prod");
  });
  envDevButton.addEventListener("click", () => {
    setApiEnv("dev");
  });
  saveButton.addEventListener("click", () => {
    void (async () => {
      const syncToken = normalizeSyncToken(syncTokenInput.value);
      await chrome.storage.sync.set({
        apiEnv,
        apiUrl: apiUrlInput.value.trim(),
        syncToken
      });
      updateSettingsSection(syncToken.length > 0);
      setStatus("Settings saved.", "success");
    })();
  });
  syncButton.addEventListener("click", () => {
    startCapture({
      clearLogs: true,
      label: "Syncing",
      messageType: "sync-now",
      onComplete: (response) => {
        if (!isSyncNowResponse(response) || !response.ok) {
          setStatus(
            isSyncNowResponse(response) && !response.ok ? response.error : "Sync failed.",
            "error"
          );
          return;
        }
        setStatus(
          `Synced ${response.result.upserted} shots (${response.captured} captured).`,
          "success"
        );
      }
    });
  });
  dryRunButton.addEventListener("click", () => {
    startCapture({
      clearLogs: true,
      label: "Dry run",
      messageType: "dry-run",
      onComplete: (response) => {
        if (!isDryRunResponse(response) || !response.ok) {
          setStatus(
            isDryRunResponse(response) && !response.ok ? response.error : "Dry run failed.",
            "error"
          );
          return;
        }
        showDryRunPreview(response.payload);
        setStatus(
          `Dry run: ${response.captured} shots captured (not uploaded).`,
          "success"
        );
      }
    });
  });
  stopButton.addEventListener("click", () => {
    setStatus("Stopping\u2026");
    stopButton.disabled = true;
    chrome.runtime.sendMessage({ type: "stop-sync" }, () => {
      stopButton.disabled = false;
      loadLogs();
    });
  });
  chrome.runtime.onMessage.addListener((message) => {
    if (!isBackgroundBroadcast(message)) {
      return;
    }
    if (message.type === "log-updated") {
      renderLogs(message.logs);
      return;
    }
    if (message.type === "sync-state-changed") {
      updateSyncButtons(message.state);
      if (!operationActive) {
        return;
      }
      if (message.state === "uploading") {
        setStatus("Uploading\u2026");
        return;
      }
      if (message.state === "scrolling") {
        setStatus("Scrolling bookmarks\u2026");
      }
    }
  });
  void chrome.storage.sync.get(["apiEnv", "apiUrl", "syncToken"]).then((stored) => {
    setApiEnv(stored.apiEnv === "dev" ? "dev" : "prod");
    if (typeof stored.apiUrl === "string") {
      apiUrlInput.value = stored.apiUrl;
    }
    const syncToken = typeof stored.syncToken === "string" ? normalizeSyncToken(stored.syncToken) : "";
    if (syncToken) {
      syncTokenInput.value = syncToken;
    }
    updateSettingsSection(syncToken.length > 0);
  });
  loadLogs();
  loadSyncState();
})();
