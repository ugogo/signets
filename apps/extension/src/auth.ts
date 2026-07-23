const SESSION_TOKEN_PARAM = 'session_token';

export async function signInWithGoogle(apiUrl: string): Promise<string> {
  const extensionRedirect = chrome.identity.getRedirectURL('oauth');
  const callbackURL = new URL('/auth/extension/callback', apiUrl);
  callbackURL.searchParams.set('redirect', extensionRedirect);

  const authUrl = new URL('/api/auth/sign-in/social', apiUrl);
  authUrl.searchParams.set('provider', 'google');
  authUrl.searchParams.set('callbackURL', callbackURL.toString());

  const responseUrl = await launchWebAuthFlow(authUrl.toString());
  const callbackUrl = new URL(responseUrl);

  const error = callbackUrl.searchParams.get('error');
  if (error) {
    throw new Error(`Sign-in failed: ${error}`);
  }

  const tokenFromQuery = callbackUrl.searchParams.get(SESSION_TOKEN_PARAM);
  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  const tokenFromHash = parseHashParam(callbackUrl.hash, SESSION_TOKEN_PARAM);
  if (tokenFromHash) {
    return tokenFromHash;
  }

  throw new Error(
    'Sign-in completed but no session token was returned. Try again.',
  );
}

export async function signOut(): Promise<void> {
  await chrome.storage.sync.remove('sessionToken');
}

function launchWebAuthFlow(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { interactive: true, url },
      (responseUrl) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error('Sign-in was cancelled.'));
          return;
        }

        resolve(responseUrl);
      },
    );
  });
}

function parseHashParam(hash: string, key: string): null | string {
  if (!hash.startsWith('#')) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(1));
  return params.get(key);
}
