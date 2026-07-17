import type { SyncResult, SyncShotInput } from '@signets/shared';

export type ExtensionMessage =
  | { count: number; type: 'shots-captured' }
  | { type: 'get-captured-shots' }
  | { type: 'sync-now' };

export type GetCapturedShotsResponse = {
  shots: SyncShotInput[];
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

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    return false;
  }

  const message = value as { type?: unknown };
  return (
    message.type === 'shots-captured' ||
    message.type === 'get-captured-shots' ||
    message.type === 'sync-now'
  );
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
