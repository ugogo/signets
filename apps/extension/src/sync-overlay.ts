const OVERLAY_ID = 'signets-sync-overlay';
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const ENTER_MS = 200;
const EXIT_MS = 160;

const OVERLAY_STYLE = [
  'align-items:center',
  'background:#09090b',
  'border:1px solid #3f3f46',
  'border-radius:12px',
  'box-shadow:0 8px 32px rgba(0,0,0,0.45)',
  'color:#f4f4f5',
  'display:flex',
  'font-family:system-ui,sans-serif',
  'font-size:12px',
  'gap:10px',
  'padding:10px 12px',
  'position:fixed',
  'right:16px',
  'top:16px',
  'transform-origin:top right',
  'z-index:2147483647',
].join(';');

export function removeSyncOverlay(animated = true): void {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    return;
  }

  removeOverlayElement(overlay, animated);
}

export function showSyncOverlay(onStop: () => void): void {
  removeSyncOverlay(false);

  const reducedMotion = prefersReducedMotion();
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = OVERLAY_STYLE;
  overlay.style.transition = overlayTransition(reducedMotion);
  setOverlayHidden(overlay, reducedMotion);

  const label = document.createElement('span');
  label.textContent = 'Signets sync';

  const countLabel = document.createElement('span');
  countLabel.dataset.signetsCount = 'true';
  countLabel.textContent = '0 shots';
  countLabel.style.color = '#a1a1aa';

  const stopButton = document.createElement('button');
  stopButton.type = 'button';
  stopButton.textContent = 'Stop';
  stopButton.style.cssText =
    'background:#27272a;border:1px solid #52525b;border-radius:8px;color:#f4f4f5;cursor:pointer;font:inherit;font-weight:600;padding:6px 10px;';
  stopButton.addEventListener('click', onStop);

  overlay.append(label, countLabel, stopButton);
  document.documentElement.append(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setOverlayVisible(overlay, reducedMotion);
    });
  });
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

function overlayTransition(reducedMotion: boolean): string {
  const duration = reducedMotion ? `${ENTER_MS}ms` : `${ENTER_MS}ms`;
  const properties = reducedMotion
    ? `opacity ${duration} ${EASE_OUT}`
    : `opacity ${duration} ${EASE_OUT}, transform ${duration} ${EASE_OUT}`;
  return properties;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function removeOverlayElement(overlay: HTMLElement, animated: boolean): void {
  if (!animated) {
    overlay.remove();
    return;
  }

  const reducedMotion = prefersReducedMotion();
  const duration = reducedMotion ? ENTER_MS : EXIT_MS;
  overlay.style.transition = overlayTransition(reducedMotion);
  setOverlayHidden(overlay, reducedMotion);

  let removed = false;
  const finish = () => {
    if (removed) {
      return;
    }
    removed = true;
    overlay.remove();
  };

  overlay.addEventListener('transitionend', finish, { once: true });
  window.setTimeout(finish, duration + 50);
}

function setOverlayHidden(overlay: HTMLElement, reducedMotion: boolean): void {
  overlay.style.opacity = '0';
  if (!reducedMotion) {
    overlay.style.transform = 'translateY(-8px)';
  }
}

function setOverlayVisible(overlay: HTMLElement, reducedMotion: boolean): void {
  overlay.style.opacity = '1';
  if (!reducedMotion) {
    overlay.style.transform = 'translateY(0)';
  }
}
