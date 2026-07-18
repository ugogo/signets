const OVERLAY_ID = 'signets-sync-overlay';
const OVERLAY_STYLE =
  'align-items:center;background:#09090b;border:1px solid #3f3f46;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.45);color:#f4f4f5;display:flex;font-family:system-ui,sans-serif;font-size:12px;gap:10px;padding:10px 12px;position:fixed;right:16px;top:16px;z-index:2147483647;';

export function showSyncOverlay(onStop: () => void): void {
  removeSyncOverlay();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = OVERLAY_STYLE;

  const label = document.createElement('span');
  label.textContent = 'Signets sync';

  const count = document.createElement('span');
  count.dataset.signetsCount = 'true';
  count.textContent = '0 shots';
  count.style.color = '#a1a1aa';

  const stopButton = document.createElement('button');
  stopButton.type = 'button';
  stopButton.textContent = 'Stop';
  stopButton.style.cssText =
    'background:#27272a;border:1px solid #52525b;border-radius:8px;color:#f4f4f5;cursor:pointer;font:inherit;font-weight:600;padding:6px 10px;';
  stopButton.addEventListener('click', onStop);

  overlay.append(label, count, stopButton);
  document.documentElement.append(overlay);
}

export function updateSyncOverlay(count: number): void {
  const countElement = document.querySelector<HTMLElement>(
    `#${OVERLAY_ID} [data-signets-count]`,
  );
  if (!countElement) {
    return;
  }

  countElement.textContent = `${count} shot${count === 1 ? '' : 's'}`;
}

export function removeSyncOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}
