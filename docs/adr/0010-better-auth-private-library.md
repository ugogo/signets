# Better Auth for private libraries

**Status:** Accepted  
**Date:** 2026-07-23  
**Supersedes:** [0004-single-user-now-multi-user-ready.md](./0004-single-user-now-multi-user-ready.md)

## Context

Signets started with a shared sync token and a public gallery keyed by `USER_SLUG`. That was fine for a single-owner MVP, but it could not support real multi-user isolation, per-user libraries, or safe curation from the web app and extension.

## Decision

Adopt [better-auth](https://www.better-auth.com/) on the NestJS API via `@thallesp/nestjs-better-auth`, with Google OAuth as the sole sign-in provider for now.

- **API:** Global auth guard on all routes. `@AllowAnonymous()` only on `/health`, `/api/auth/*`, `/auth/extension/callback`, and `/x/media` (browser media elements cannot attach cookies).
- **Sessions:** Cookie sessions for the web app (`credentials: 'include'`). Bearer sessions for the Chrome extension (via the better-auth bearer plugin).
- **Data model:** better-auth `user`, `session`, `account`, and `verification` tables. Drop `User.slug`. `Shot.userId` references the auth user id. Existing production data is explicitly wiped as part of migration.
- **Web:** `/login` route with Google sign-in. Library routes redirect unauthenticated users to login. Remove sync-token curation UI.
- **Extension:** `chrome.identity.launchWebAuthFlow` through `/api/auth/sign-in/social`, then `/auth/extension/callback` to return a bearer token stored in `chrome.storage`.

## Consequences

- Libraries are private; only signed-in owners can browse or curate.
- `SYNC_TOKEN` and `USER_SLUG` env vars are removed.
- New required env vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Share-by-link, GitHub OAuth, and vanity slugs remain out of scope.
