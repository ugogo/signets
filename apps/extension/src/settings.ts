import { API_URLS, type ApiEnv } from './constants.js';

export type Settings = {
  apiUrl: string;
  sessionToken: string;
};

export function isSignedIn(settings: Settings): boolean {
  return settings.sessionToken.length > 0;
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get([
    'apiEnv',
    'apiUrl',
    'sessionToken',
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
    sessionToken:
      typeof stored.sessionToken === 'string' ? stored.sessionToken.trim() : '',
  };
}
