const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiFetchOptions: RequestInit = {
  credentials: 'include',
};

export function apiUrl(path: string): URL {
  return new URL(path, apiBaseUrl);
}
