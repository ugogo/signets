import { createAuthClient } from 'better-auth/react';

import { sanitizeRedirect } from '@/lib/auth-redirect';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    credentials: 'include',
  },
});

export async function getSession() {
  const { data } = await authClient.getSession();
  return data;
}

export async function signInWithGoogle(redirectTo?: string) {
  const path = sanitizeRedirect(redirectTo);
  const callbackURL = new URL(path, window.location.origin).toString();

  await authClient.signIn.social({
    callbackURL,
    provider: 'google',
  });
}

export async function signOut() {
  await authClient.signOut();
}
