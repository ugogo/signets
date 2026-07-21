const STORAGE_KEY = 'signets-sync-token';
const CHANGE_EVENT = 'signets-curation-token-change';

export function getCurationToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setCurationToken(token: string): void {
  window.localStorage.setItem(STORAGE_KEY, token.trim());
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearCurationToken(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function hasCurationToken(): boolean {
  const token = getCurationToken();
  return Boolean(token && token.length >= 16);
}

export function subscribeCurationToken(onStoreChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}
