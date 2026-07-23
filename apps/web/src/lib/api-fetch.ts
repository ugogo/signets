import { redirectToLogin } from '@/lib/auth-redirect';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiFetchOptions: RequestInit = {
  credentials: 'include',
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export async function apiFetch(
  input: URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, {
    ...apiFetchOptions,
    ...init,
  });

  if (response.status === 401) {
    // Redirect immediately — don't wait for Query cache onError.
    redirectToLogin();
    throw new UnauthorizedError();
  }

  return response;
}

export function apiUrl(path: string): URL {
  return new URL(path, apiBaseUrl);
}
