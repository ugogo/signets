const LOGIN_PATH = '/login';

/**
 * Only allow same-origin relative paths. Blocks open redirects
 * (`https://…`, `//evil.com`, etc.).
 */
export function sanitizeRedirect(
  path: unknown,
  fallback: string = '/',
): string {
  if (typeof path !== 'string') {
    return fallback;
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }

  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}?`)) {
    return fallback;
  }

  return path;
}

let redirecting = false;

/** Hard navigation — clears client state after session expiry (401). */
export function redirectToLogin(returnTo?: string) {
  if (typeof window === 'undefined' || redirecting) {
    return;
  }

  redirecting = true;

  const destination = sanitizeRedirect(
    returnTo ?? `${window.location.pathname}${window.location.search}`,
  );
  const loginUrl = new URL(LOGIN_PATH, window.location.origin);

  if (destination !== '/') {
    loginUrl.searchParams.set('redirect', destination);
  }

  window.location.assign(loginUrl.toString());
}
