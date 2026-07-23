import { createFileRoute, redirect } from '@tanstack/react-router';
import { Button } from 'pickle-ui/button';
import { Text } from 'pickle-ui/text';
import { useState } from 'react';

import { getSession, signInWithGoogle } from '@/lib/auth-client';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const session = await getSession();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  const handleSignIn = async () => {
    setPending(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Sign-in failed. Try again.',
      );
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-2">
          <Text as="h1" variant="h1">
            Signets
          </Text>
          <Text as="p" tone="muted">
            Sign in to browse your private design reference library.
          </Text>
        </div>
        <Button
          disabled={pending}
          onClick={() => void handleSignIn()}
          size="lg"
        >
          {pending ? 'Redirecting…' : 'Continue with Google'}
        </Button>
        {error ? (
          <Text as="p" className="text-destructive" variant="small">
            {error}
          </Text>
        ) : null}
      </div>
    </main>
  );
}
