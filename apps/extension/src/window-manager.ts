const CONTROL_PANEL_PATH = 'popup.html?panel=1';

let controlWindowId: number | undefined;

function isControlPanelUrl(url: string | undefined): boolean {
  return url?.includes('popup.html') === true;
}

async function findExistingControlWindow(): Promise<chrome.windows.Window | undefined> {
  const windows = await chrome.windows.getAll({ populate: true });

  return windows.find((window) => {
    if (window.type !== 'popup') {
      return false;
    }

    return window.tabs?.some((tab) => isControlPanelUrl(tab.url)) ?? false;
  });
}

export async function ensureControlWindow(): Promise<number> {
  if (controlWindowId !== undefined) {
    try {
      await chrome.windows.get(controlWindowId);
      await chrome.windows.update(controlWindowId, { focused: true });
      return controlWindowId;
    } catch {
      controlWindowId = undefined;
    }
  }

  const existing = await findExistingControlWindow();
  if (existing?.id !== undefined) {
    controlWindowId = existing.id;
    await chrome.windows.update(existing.id, { focused: true });
    return existing.id;
  }

  const created = await chrome.windows.create({
    focused: true,
    height: 580,
    type: 'popup',
    url: chrome.runtime.getURL(CONTROL_PANEL_PATH),
    width: 340,
  });

  if (created.id === undefined) {
    throw new Error('Could not open Signets control panel.');
  }

  controlWindowId = created.id;
  return created.id;
}

export function clearControlWindowId(windowId: number): void {
  if (windowId === controlWindowId) {
    controlWindowId = undefined;
  }
}
