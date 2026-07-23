import {
  parseJsonResponse,
  type SyncPayload,
  type SyncResult,
  syncResultSchema,
  type SyncState,
  syncStateSchema,
} from '@signets/shared';

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

export async function fetchSyncState(settings: Settings): Promise<SyncState> {
  const response = await requestSync(
    settings,
    '/sync/state',
    { headers: authHeaders(settings.sessionToken) },
    'fetching sync state',
  );

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SyncRequestError(
      formatSyncFailure(response.status, settings.apiUrl, detail),
      response.status,
    );
  }

  return parseJsonResponse(syncStateSchema, response);
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
        ...authHeaders(settings.sessionToken),
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

  return parseJsonResponse(syncResultSchema, response);
}

export async function verifySyncCredentials(settings: Settings): Promise<void> {
  const response = await requestSync(
    settings,
    '/sync/verify',
    { headers: authHeaders(settings.sessionToken) },
    'verifying session',
  );

  if (response.status === 404) {
    throw new SyncRequestError(
      formatSyncFailure(
        404,
        settings.apiUrl,
        'Sync verification endpoint not found. Check the API URL.',
      ),
      404,
    );
  }

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SyncRequestError(
      formatSyncFailure(response.status, settings.apiUrl, detail),
      response.status,
    );
  }
}

function authHeaders(sessionToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${sessionToken}`,
  };
}

function formatNetworkError(
  error: unknown,
  apiUrl: string,
  action: string,
): string {
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

function formatSyncFailure(
  status: number,
  apiUrl: string,
  detail?: string,
): string {
  if (status === 401) {
    return (
      `Session expired or invalid (HTTP 401) for ${apiUrl}. ` +
      'Sign in again from the extension settings, then retry.'
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

async function readErrorMessage(
  response: Response,
): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') {
      return undefined;
    }

    const record = body as Record<string, unknown>;
    const message = record.message;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }

    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }

    if (message && typeof message === 'object') {
      return JSON.stringify(message);
    }

    if (typeof record.error === 'string' && record.error.length > 0) {
      return record.error;
    }

    if (Array.isArray(record.issues)) {
      return record.issues
        .map((issue) =>
          issue && typeof issue === 'object' && 'message' in issue
            ? String((issue as { message: unknown }).message)
            : String(issue),
        )
        .join(', ');
    }
  } catch {
    // Ignore unreadable error bodies.
  }

  return undefined;
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
    throw new SyncRequestError(
      formatNetworkError(error, settings.apiUrl, action),
      0,
    );
  }
}
