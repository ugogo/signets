export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: number;
};

export type LogLevel = 'error' | 'info' | 'success' | 'warn';

const MAX_LOG_ENTRIES = 100;
const logs: LogEntry[] = [];

export function appendLog(level: LogLevel, message: string): void {
  logs.push({ level, message, timestamp: Date.now() });
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.shift();
  }

  void chrome.runtime
    .sendMessage({ logs: [...logs], type: 'log-updated' })
    .catch(() => undefined);
}

export function clearLogs(): void {
  logs.length = 0;
  void chrome.runtime
    .sendMessage({ logs: [], type: 'log-updated' })
    .catch(() => undefined);
}

export function getLogs(): LogEntry[] {
  return [...logs];
}
