export const API_URLS = {
  dev: 'http://localhost:3001',
  prod: 'https://signets-api.onrender.com',
} as const;

export const BOOKMARKS_URL = 'https://x.com/i/bookmarks';

export const BOOKMARKS_RESPONSE_EVENT = 'signets-bookmarks-response';

/** Keep batches small enough for default HTTP body limits and long captions. */
export const SYNC_BATCH_SIZE = 50;

export type ApiEnv = keyof typeof API_URLS;

export type SyncState = 'idle' | 'scrolling' | 'uploading';
