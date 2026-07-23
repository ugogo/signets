import { createAuthClient } from 'better-auth/react';

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

export async function signInWithGoogle() {
  await authClient.signIn.social({
    callbackURL: window.location.origin,
    provider: 'google',
  });
}

export async function signOut() {
  await authClient.signOut();
}
