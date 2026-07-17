# Signets

Personal, hosted gallery for browsing design images saved as X bookmarks.

## Live

| Service | URL |
| ------- | --- |
| **Gallery (web)** | https://signets-web.ugo-j-onali.workers.dev |
| **API** | https://signets-api.onrender.com |
| **API health** | https://signets-api.onrender.com/health |

**Dashboards:** [Cloudflare Workers](https://dash.cloudflare.com/) (worker `signets-web`) · [Render](https://dashboard.render.com/web/srv-d9d3qvojs32c738nf7eg) · [Neon](https://console.neon.tech/app/projects/winter-river-82348896)

## Stack

- **Web:** TanStack Start on Cloudflare Workers (`apps/web`)
- **API:** NestJS + Prisma + Neon Postgres (`apps/api`)
- **Extension:** Chrome MV3 companion (`apps/extension`)
- **Shared contract:** Zod schemas in `packages/shared`

See `docs/adr/` and `CONTEXT.md` for product and architecture decisions.

## Prerequisites

- Node 22+ (pinned in `.node-version`; use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm))
- pnpm 10+ (pinned in root `packageManager`; Corepack installs the correct version)
- Neon Postgres database (or a temporary dev DB via `create-db`)

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Get a Postgres database for local development:

```bash
# Temporary cloud DB (24h, good for first run)
pnpm dlx create-db@latest create --env apps/api/.env --ttl 24h
# Then add DIRECT_URL (same as DATABASE_URL) and SYNC_TOKEN to apps/api/.env
```

Or use a [Neon](https://neon.tech) project and paste pooled/direct URLs into `apps/api/.env`.

Set `DATABASE_URL`, `DIRECT_URL`, and `SYNC_TOKEN` in `apps/api/.env`, then migrate:

```bash
pnpm db:migrate
```

For Neon, use the **pooled** host (`*-pooler`) for `DATABASE_URL` and the **direct** host for `DIRECT_URL`. For local Postgres, both can point at the same URL.

Build the extension before loading it in Chrome:

```bash
pnpm --filter @signets/extension build
```

## Development

```bash
pnpm dev:api   # NestJS on http://localhost:3001
pnpm dev:web   # TanStack Start on http://localhost:3000
```

Load the extension from `apps/extension/public` in Chrome (Developer mode → Load unpacked).

1. Open `https://x.com/i/bookmarks` and scroll to capture GraphQL responses.
2. Open the extension popup, save API URL + sync token, click **Sync captured shots**.

## Deployment

Production is live (see [Live](#live) above). Redeploy from your machine:

### API on Render

[`render.yaml`](render.yaml) defines the `signets-api` web service. Required env vars:

| Variable       | Notes                                      |
| -------------- | ------------------------------------------ |
| `DATABASE_URL` | Neon pooled connection string              |
| `DIRECT_URL`   | Neon direct connection string (migrations) |
| `SYNC_TOKEN`   | Long random secret (16+ chars)             |
| `WEB_ORIGIN`   | Public gallery URL(s), comma-separated     |
| `USER_SLUG`    | User key for single-user MVP               |

`start:prod` runs `prisma migrate deploy` before boot. Health check: `GET /health`.

### Web on Cloudflare Workers

`VITE_API_URL` is baked in at **build time**. Production build + deploy:

```bash
cd apps/web
VITE_API_URL=https://signets-api.onrender.com pnpm run deploy
```

Or set `VITE_API_URL` in `apps/web/.env.production` (see `.env.production.example`).

After deploy, ensure Render `WEB_ORIGIN` includes your Workers URL (currently `https://signets-web.ugo-j-onali.workers.dev`).

### Extension

1. `pnpm --filter @signets/extension build`
2. Add your production API origin to `host_permissions` in `apps/extension/public/manifest.json`
3. Load unpacked from `apps/extension/public`

## Scripts

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Run web + api in parallel                         |
| `pnpm typecheck`   | Typecheck all workspaces                          |
| `pnpm test`        | Run workspace tests                               |
| `pnpm db:generate` | Create a Prisma migration (`prisma migrate dev`)  |
| `pnpm db:migrate`  | Apply Prisma migrations (`prisma migrate deploy`) |

## Agent skills

Tech-stack skills installed under `.agents/skills/`:

- TanStack Start / Router / Query best practices
- NestJS best practices
- Neon Postgres
- Prisma (CLI, Client API, database setup, Postgres)
