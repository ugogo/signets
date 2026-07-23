import type { SyncState } from './constants.js';
import type { LogEntry } from './log.js';

import { signOut } from './auth.js';
import {
  isBackgroundBroadcast,
  isDryRunResponse,
  isSignInResponse,
  isSyncNowResponse,
  isSyncStateResponse,
} from './messages.js';
import { isSignedIn, loadSettings } from './settings.js';

const apiUrlInput = document.querySelector<HTMLInputElement>('#apiUrl')!;
const apiUrlWrapper =
  document.querySelector<HTMLLabelElement>('#apiUrlWrapper')!;
const envProdButton = document.querySelector<HTMLButtonElement>('#envProd')!;
const envDevButton = document.querySelector<HTMLButtonElement>('#envDev')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save')!;
const signInButton = document.querySelector<HTMLButtonElement>('#signIn')!;
const signOutButton = document.querySelector<HTMLButtonElement>('#signOut')!;
const syncButton = document.querySelector<HTMLButtonElement>('#sync')!;
const dryRunButton = document.querySelector<HTMLButtonElement>('#dryRun')!;
const stopButton = document.querySelector<HTMLButtonElement>('#stop')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const logSection = document.querySelector<HTMLDetailsElement>('#logSection')!;
const logElement = document.querySelector<HTMLPreElement>('#log')!;
const dryRunPreview =
  document.querySelector<HTMLDetailsElement>('#dryRunPreview')!;
const dryRunPayload = document.querySelector<HTMLPreElement>('#dryRunPayload')!;
const settingsSection =
  document.querySelector<HTMLDetailsElement>('#settingsSection')!;
const settingsSummary =
  document.querySelector<HTMLElement>('#settingsSummary')!;
document.title = 'Signets Sync';

let apiEnv: 'dev' | 'prod' = 'prod';
let operationActive = false;

function formatLogTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function hideDryRunPreview(): void {
  dryRunPreview.classList.add('hidden');
  dryRunPreview.open = false;
  dryRunPayload.textContent = '';
}

function loadLogs(): void {
  chrome.runtime.sendMessage({ type: 'get-logs' }, (response) => {
    if (
      typeof response === 'object' &&
      response !== null &&
      'logs' in response &&
      Array.isArray((response as { logs: LogEntry[] }).logs)
    ) {
      renderLogs((response as { logs: LogEntry[] }).logs);
    }
  });
}

function loadSyncState(): void {
  chrome.runtime.sendMessage({ type: 'get-sync-state' }, (response) => {
    if (isSyncStateResponse(response)) {
      updateSyncButtons(response.state);
      if (response.state !== 'idle' && operationActive) {
        setStatus(
          response.state === 'uploading' ? 'Uploading…' : 'Sync in progress…',
        );
      }
    }
  });
}

async function refreshAuthUi(): Promise<void> {
  const settings = await loadSettings();
  const signedIn = isSignedIn(settings);
  signInButton.classList.toggle('hidden', signedIn);
  signOutButton.classList.toggle('hidden', !signedIn);
  syncButton.disabled = !signedIn;
  dryRunButton.disabled = !signedIn;
  updateSettingsSection(signedIn);
}

function renderLogs(logs: LogEntry[]): void {
  if (logs.length === 0) {
    logElement.textContent = 'No activity yet.';
    return;
  }

  logElement.replaceChildren();
  for (const entry of logs) {
    const line = document.createElement('span');
    line.className = `log-${entry.level}`;
    line.textContent = `[${formatLogTime(entry.timestamp)}] ${entry.message}`;
    logElement.appendChild(line);
    logElement.appendChild(document.createTextNode('\n'));
  }
  logElement.scrollTop = logElement.scrollHeight;
}

function setApiEnv(env: 'dev' | 'prod'): void {
  apiEnv = env;
  const isDev = env === 'dev';
  apiUrlWrapper.classList.toggle('hidden', !isDev);
  envProdButton.classList.toggle('active', !isDev);
  envDevButton.classList.toggle('active', isDev);
}

function setStatus(
  message: string,
  tone: 'default' | 'error' | 'success' = 'default',
): void {
  status.textContent = message;
  status.classList.toggle('status-error', tone === 'error');
  status.classList.toggle('status-success', tone === 'success');
}

function showDryRunPreview(payload: unknown): void {
  dryRunPayload.textContent = JSON.stringify(payload, null, 2);
  dryRunPreview.classList.remove('hidden');
  dryRunPreview.open = true;
}

function startCapture(options: {
  clearLogs: boolean;
  label: string;
  messageType: 'dry-run' | 'sync-now';
  onComplete: (response: unknown) => void;
}): void {
  operationActive = true;
  setStatus(`${options.label}…`);
  updateSyncButtons('scrolling');
  hideDryRunPreview();

  const begin = (): void => {
    chrome.runtime.sendMessage({ type: options.messageType }, (response) => {
      operationActive = false;
      updateSyncButtons('idle');
      options.onComplete(response);
      loadLogs();
    });
  };

  if (options.clearLogs) {
    chrome.runtime.sendMessage({ type: 'clear-logs' }, () => {
      loadLogs();
      begin();
    });
    return;
  }

  begin();
}

function updateSettingsSection(signedIn: boolean): void {
  if (signedIn) {
    settingsSection.open = false;
    settingsSummary.textContent = 'Settings · signed in';
    return;
  }

  settingsSection.open = true;
  settingsSummary.textContent = 'Settings';
}

function updateSyncButtons(state: SyncState): void {
  const inProgress = state !== 'idle';
  syncButton.classList.toggle('hidden', inProgress);
  dryRunButton.classList.toggle('hidden', inProgress);
  stopButton.classList.toggle('hidden', state !== 'scrolling');
  saveButton.disabled = inProgress;

  if (inProgress) {
    logSection.open = true;
  }
}

envProdButton.addEventListener('click', () => {
  setApiEnv('prod');
});

envDevButton.addEventListener('click', () => {
  setApiEnv('dev');
});

saveButton.addEventListener('click', () => {
  void (async () => {
    await chrome.storage.sync.set({
      apiEnv,
      apiUrl: apiUrlInput.value.trim(),
    });

    setStatus('Settings saved.', 'success');
  })();
});

signInButton.addEventListener('click', () => {
  signInButton.disabled = true;
  setStatus('Opening Google sign-in…');

  chrome.runtime.sendMessage({ type: 'sign-in-with-google' }, (response) => {
    signInButton.disabled = false;

    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message ?? 'Sign-in failed.', 'error');
      return;
    }

    if (!isSignInResponse(response)) {
      setStatus('Sign-in failed.', 'error');
      return;
    }

    if (!response.ok) {
      setStatus(response.error, 'error');
      return;
    }

    void refreshAuthUi().then(() => {
      setStatus('Signed in.', 'success');
    });
  });
});

signOutButton.addEventListener('click', () => {
  void (async () => {
    await signOut();
    await refreshAuthUi();
    setStatus('Signed out.', 'success');
  })();
});

syncButton.addEventListener('click', () => {
  startCapture({
    clearLogs: true,
    label: 'Syncing',
    messageType: 'sync-now',
    onComplete: (response) => {
      if (!isSyncNowResponse(response) || !response.ok) {
        setStatus(
          isSyncNowResponse(response) && !response.ok
            ? response.error
            : 'Sync failed.',
          'error',
        );
        return;
      }

      setStatus(
        `Synced ${response.result.upserted} shots (${response.captured} captured).`,
        'success',
      );
    },
  });
});

dryRunButton.addEventListener('click', () => {
  startCapture({
    clearLogs: true,
    label: 'Dry run',
    messageType: 'dry-run',
    onComplete: (response) => {
      if (!isDryRunResponse(response) || !response.ok) {
        setStatus(
          isDryRunResponse(response) && !response.ok
            ? response.error
            : 'Dry run failed.',
          'error',
        );
        return;
      }

      showDryRunPreview(response.payload);
      setStatus(
        `Dry run: ${response.captured} shots captured (not uploaded).`,
        'success',
      );
    },
  });
});

stopButton.addEventListener('click', () => {
  setStatus('Stopping…');
  stopButton.disabled = true;
  chrome.runtime.sendMessage({ type: 'stop-sync' }, () => {
    stopButton.disabled = false;
    loadLogs();
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (!isBackgroundBroadcast(message)) {
    return;
  }

  if (message.type === 'log-updated') {
    renderLogs(message.logs);
    return;
  }

  if (message.type === 'sync-state-changed') {
    updateSyncButtons(message.state);

    if (!operationActive) {
      return;
    }

    if (message.state === 'uploading') {
      setStatus('Uploading…');
      return;
    }

    if (message.state === 'scrolling') {
      setStatus('Fetching bookmarks…');
    }
    return;
  }

  if (message.type === 'sign-in-complete') {
    signInButton.disabled = false;

    if (message.ok) {
      void refreshAuthUi().then(() => {
        setStatus('Signed in.', 'success');
      });
      return;
    }

    setStatus(message.error ?? 'Sign-in failed.', 'error');
  }
});

void chrome.storage.sync.get(['apiEnv', 'apiUrl']).then(async (stored) => {
  setApiEnv(stored.apiEnv === 'dev' ? 'dev' : 'prod');
  if (typeof stored.apiUrl === 'string') {
    apiUrlInput.value = stored.apiUrl;
  }

  await refreshAuthUi();
});

loadLogs();
loadSyncState();
