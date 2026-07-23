import {
  syncPayloadSchema,
  syncResultSchema,
  syncShotInputSchema,
} from '@signets/shared';
import { z } from 'zod';

export const extensionActivityStateSchema = z.enum([
  'idle',
  'scrolling',
  'uploading',
]);

export type ExtensionActivityState = z.infer<
  typeof extensionActivityStateSchema
>;

/** @deprecated Use ExtensionActivityState */
export type SyncState = ExtensionActivityState;

export const logLevelSchema = z.enum(['error', 'info', 'success', 'warn']);

export const logEntrySchema = z.object({
  level: logLevelSchema,
  message: z.string(),
  timestamp: z.number(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

export const extensionMessageSchema = z.discriminatedUnion('type', [
  z.object({ count: z.number(), type: z.literal('shots-captured') }),
  z.object({
    cursorPreview: z.string().optional(),
    entries: z.number(),
    hasMore: z.boolean().optional(),
    newShots: z.number().optional(),
    page: z.number().optional(),
    parsed: z.number(),
    source: z.enum(['fetch', 'intercept', 'pending']).optional(),
    total: z.number(),
    type: z.literal('bookmarks-intercepted'),
  }),
  z.object({
    level: logLevelSchema,
    message: z.string(),
    type: z.literal('capture-log'),
  }),
  z.object({ type: z.literal('clear-captured-shots') }),
  z.object({ type: z.literal('clear-logs') }),
  z.object({ type: z.literal('dry-run') }),
  z.object({ type: z.literal('get-captured-shots') }),
  z.object({ type: z.literal('get-logs') }),
  z.object({ type: z.literal('get-sync-state') }),
  z.object({ type: z.literal('sign-in-with-google') }),
  z.object({
    lastBookmarkSyncAt: z.iso.datetime().nullable().optional(),
    type: z.literal('start-auto-scroll'),
  }),
  z.object({ type: z.literal('stop-auto-scroll') }),
  z.object({ type: z.literal('stop-sync') }),
  z.object({ type: z.literal('sync-now') }),
]);

export type ExtensionMessage = z.infer<typeof extensionMessageSchema>;

export const backgroundBroadcastSchema = z.discriminatedUnion('type', [
  z.object({
    logs: z.array(logEntrySchema),
    type: z.literal('log-updated'),
  }),
  z.object({
    state: extensionActivityStateSchema,
    type: z.literal('sync-state-changed'),
  }),
  z.object({
    error: z.string().optional(),
    ok: z.boolean(),
    type: z.literal('sign-in-complete'),
  }),
]);

export type BackgroundBroadcast = z.infer<typeof backgroundBroadcastSchema>;

export const getCapturedShotsResponseSchema = z.object({
  shots: z.array(syncShotInputSchema),
});

export type GetCapturedShotsResponse = z.infer<
  typeof getCapturedShotsResponseSchema
>;

export const autoScrollResponseSchema = z.object({
  count: z.number(),
  error: z.string().optional(),
  stopped: z.boolean(),
});

export type AutoScrollResponse = z.infer<typeof autoScrollResponseSchema>;

export const syncNowResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    captured: z.number(),
    ok: z.literal(true),
    result: syncResultSchema,
  }),
  z.object({
    error: z.string(),
    ok: z.literal(false),
  }),
]);

export type SyncNowResponse = z.infer<typeof syncNowResponseSchema>;

export const dryRunResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    captured: z.number(),
    ok: z.literal(true),
    payload: syncPayloadSchema,
  }),
  z.object({
    error: z.string(),
    ok: z.literal(false),
  }),
]);

export type DryRunResponse = z.infer<typeof dryRunResponseSchema>;

export const signInResponseSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({
    error: z.string(),
    ok: z.literal(false),
  }),
]);

export type SignInResponse = z.infer<typeof signInResponseSchema>;

export const extensionSyncStateResponseSchema = z.object({
  state: extensionActivityStateSchema,
});

export type ExtensionSyncStateResponse = z.infer<
  typeof extensionSyncStateResponseSchema
>;

export function isAutoScrollResponse(
  value: unknown,
): value is AutoScrollResponse {
  return autoScrollResponseSchema.safeParse(value).success;
}

export function isBackgroundBroadcast(
  value: unknown,
): value is BackgroundBroadcast {
  return backgroundBroadcastSchema.safeParse(value).success;
}

export function isDryRunResponse(value: unknown): value is DryRunResponse {
  return dryRunResponseSchema.safeParse(value).success;
}

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  return extensionMessageSchema.safeParse(value).success;
}

export function isExtensionSyncStateResponse(
  value: unknown,
): value is ExtensionSyncStateResponse {
  return extensionSyncStateResponseSchema.safeParse(value).success;
}

export function isGetCapturedShotsResponse(
  value: unknown,
): value is GetCapturedShotsResponse {
  return getCapturedShotsResponseSchema.safeParse(value).success;
}

export function isSignInResponse(value: unknown): value is SignInResponse {
  return signInResponseSchema.safeParse(value).success;
}

export function isSyncNowResponse(value: unknown): value is SyncNowResponse {
  return syncNowResponseSchema.safeParse(value).success;
}

/** @deprecated Use isExtensionSyncStateResponse */
export const isSyncStateResponse = isExtensionSyncStateResponse;
