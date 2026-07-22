import { API_URLS, type ApiEnv } from './constants.js';

export type Settings = {
  apiUrl: string;
  syncToken: string;
};

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get([
    'apiEnv',
    'apiUrl',
    'syncToken',
  ]);
  const apiEnv: ApiEnv = stored.apiEnv === 'dev' ? 'dev' : 'prod';
  const apiUrl =
    apiEnv === 'prod'
      ? API_URLS.prod
      : typeof stored.apiUrl === 'string'
        ? stored.apiUrl
        : API_URLS.dev;

  return {
    apiUrl,
    syncToken:
      typeof stored.syncToken === 'string'
        ? normalizeSyncToken(stored.syncToken)
        : '',
  };
}

export function normalizeSyncToken(token: string): string {
  return token.trim().replace(/^Bearer\s+/i, '');
}
