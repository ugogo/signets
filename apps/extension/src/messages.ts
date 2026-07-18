import type { SyncPayload, SyncResult, SyncShotInput } from '@signets/shared';

import type { LogEntry } from './log.js';
import type { SyncState } from './constants.js';

export type ExtensionMessage =
  | { count: number; type: 'shots-captured' }
  | { entries: number; parsed: number; total: number; type: 'bookmarks-intercepted' }
  | { type: 'clear-captured-shots' }
  | { type: 'clear-logs' }
  | { type: 'dry-run' }
  | { type: 'get-captured-shots' }
  | { type: 'get-logs' }
  | { type: 'get-sync-state' }
  | { type: 'start-auto-scroll' }
  | { type: 'stop-auto-scroll' }
  | { type: 'stop-sync' }
  | { type: 'sync-now' };

type ExtensionMessageType = ExtensionMessage['type'];

// Single source of truth for the runtime guard: the exhaustive Record forces a
// compile error when a new ExtensionMessage variant is added but not registered.
const EXTENSION_MESSAGE_TYPES: Record<ExtensionMessageType, true> = {
  'bookmarks-intercepted': true,
  'clear-captured-shots': true,
  'clear-logs': true,
  'dry-run': true,
  'get-captured-shots': true,
  'get-logs': true,
  'get-sync-state': true,
  'shots-captured': true,
  'start-auto-scroll': true,
  'stop-auto-scroll': true,
  'stop-sync': true,
  'sync-now': true,
};

export type BackgroundBroadcast =
  | { logs: LogEntry[]; type: 'log-updated' }
  | { state: SyncState; type: 'sync-state-changed' };

export type GetCapturedShotsResponse = {
  shots: SyncShotInput[];
};

export type AutoScrollResponse = {
  count: number;
  stopped: boolean;
};

export type SyncNowResponse =
  | {
      captured: number;
      ok: true;
      result: SyncResult;
    }
  | {
      error: string;
      ok: false;
    };

export type DryRunResponse =
  | {
      captured: number;
      ok: true;
      payload: SyncPayload;
    }
  | {
      error: string;
      ok: false;
    };

export type SyncStateResponse = {
  state: SyncState;
};

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }

  const message = value as { type?: unknown };
  return (
    typeof message.type === 'string' &&
    Object.hasOwn(EXTENSION_MESSAGE_TYPES, message.type)
  );
}

export function isBackgroundBroadcast(
  value: unknown,
): value is BackgroundBroadcast {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }

  const message = value as { type?: unknown };
  return message.type === 'log-updated' || message.type === 'sync-state-changed';
}

export function isGetCapturedShotsResponse(
  value: unknown,
): value is GetCapturedShotsResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'shots' in value &&
    Array.isArray((value as GetCapturedShotsResponse).shots)
  );
}

export function isAutoScrollResponse(
  value: unknown,
): value is AutoScrollResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'count' in value &&
    typeof (value as AutoScrollResponse).count === 'number' &&
    'stopped' in value &&
    typeof (value as AutoScrollResponse).stopped === 'boolean'
  );
}

export function isSyncNowResponse(value: unknown): value is SyncNowResponse {
  if (typeof value !== 'object' || value === null || !('ok' in value)) {
    return false;
  }

  const response = value as SyncNowResponse;
  if (response.ok) {
    return (
      typeof response.captured === 'number' &&
      typeof response.result === 'object' &&
      response.result !== null &&
      'upserted' in response.result
    );
  }

  return typeof response.error === 'string';
}

export function isDryRunResponse(value: unknown): value is DryRunResponse {
  if (typeof value !== 'object' || value === null || !('ok' in value)) {
    return false;
  }

  const response = value as DryRunResponse;
  if (response.ok) {
    return (
      typeof response.captured === 'number' &&
      typeof response.payload === 'object' &&
      response.payload !== null &&
      Array.isArray(response.payload.shots)
    );
  }

  return typeof response.error === 'string';
}

export function isSyncStateResponse(
  value: unknown,
): value is SyncStateResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'state' in value &&
    ((value as SyncStateResponse).state === 'idle' ||
      (value as SyncStateResponse).state === 'scrolling' ||
      (value as SyncStateResponse).state === 'uploading')
  );
}
