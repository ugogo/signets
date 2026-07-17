import type { SyncPayload, SyncResult } from '@signets/shared';

import type { Settings } from './settings.js';

export class SyncRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SyncRequestError';
  }
}

function authHeaders(syncToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${syncToken}`,
  };
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const message = body.message;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }

    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }

    if (message && typeof message === 'object') {
      return JSON.stringify(message);
    }

    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // Ignore unreadable error bodies.
  }

  return undefined;
}

function formatSyncFailure(
  status: number,
  apiUrl: string,
  detail?: string,
): string {
  if (status === 401) {
    return (
      `Invalid sync token (HTTP 401) for ${apiUrl}. ` +
      'Use the exact SYNC_TOKEN from apps/api/.env (no "Bearer " prefix), save settings, then retry.'
    );
  }

  if (status === 413) {
    return `Request payload too large (HTTP 413) for ${apiUrl}. Try syncing again — uploads are batched automatically.`;
  }

  if (status === 429) {
    return `Rate limited (HTTP 429) by ${apiUrl}. Wait a minute and retry.`;
  }

  const suffix = detail ? `: ${detail}` : '';
  return `API request failed (HTTP ${status}) at ${apiUrl}${suffix}`;
}

function formatNetworkError(error: unknown, apiUrl: string, action: string): string {
  if (error instanceof TypeError) {
    return (
      `Could not reach the API at ${apiUrl} while ${action}. ` +
      'Is the dev server running? Start it with pnpm --filter @signets/api dev.'
    );
  }

  if (error instanceof Error) {
    return `${action} failed: ${error.message}`;
  }

  return `${action} failed unexpectedly.`;
}

async function requestSync(
  settings: Settings,
  path: string,
  init: RequestInit,
  action: string,
): Promise<Response> {
  try {
    return await fetch(`${settings.apiUrl}${path}`, init);
  } catch (error) {
    throw new SyncRequestError(formatNetworkError(error, settings.apiUrl, action), 0);
  }
}

export async function verifySyncCredentials(settings: Settings): Promise<void> {
  const response = await requestSync(
    settings,
    '/sync/verify',
    { headers: authHeaders(settings.syncToken) },
    'verifying the sync token',
  );

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SyncRequestError(
      formatSyncFailure(response.status, settings.apiUrl, detail),
      response.status,
    );
  }
}

export async function uploadSyncBatch(
  settings: Settings,
  shots: SyncPayload['shots'],
): Promise<SyncResult> {
  const response = await requestSync(
    settings,
    '/sync',
    {
      body: JSON.stringify({ shots }),
      headers: {
        ...authHeaders(settings.syncToken),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    'uploading shots',
  );

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SyncRequestError(
      formatSyncFailure(response.status, settings.apiUrl, detail),
      response.status,
    );
  }

  return (await response.json()) as SyncResult;
}
