import type { LogLevel } from './log.js';

export function formatCursorPreview(cursor: string | undefined): string {
  if (!cursor) {
    return 'none';
  }

  if (cursor.length <= 16) {
    return cursor;
  }

  return `${cursor.slice(0, 8)}…${cursor.slice(-6)}`;
}

export function logCapture(level: LogLevel, message: string): void {
  void chrome.runtime
    .sendMessage({ level, message, type: 'capture-log' })
    .catch(() => undefined);
}
