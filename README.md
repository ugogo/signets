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

Load the extension from `apps/extension/public` in Chrome (Developer mode → Load unpacked). See [How to use](#how-to-use) for the full workflow.

## How to use

Signets turns your X (Twitter) bookmarked design images into a personal inspiration gallery. You capture shots with a Chrome extension, sync them to the API, then browse them on the web app. There is no login — the gallery is public, and only sync/curation endpoints require a shared secret.

### 1. Run the stack (local or production)

**Local development**

1. Complete [Setup](#setup) and [Development](#development) above (`pnpm dev:api`, `pnpm dev:web`).
2. Use `http://localhost:3001` as the API URL and `http://localhost:3000` as the gallery URL.

**Production**

Use the live URLs from [Live](#live):

- Gallery: `https://signets-web.ugo-j-onali.workers.dev`
- API: `https://signets-api.onrender.com`

Generate a long random `SYNC_TOKEN` (16+ characters) and set it on Render. You will paste the same value into the extension.

### 2. Install the Chrome extension

```bash
pnpm --filter @signets/extension build
```

1. Open Chrome → **Extensions** → enable **Developer mode**.
2. Click **Load unpacked** and select `apps/extension/public`.
3. Pin **Signets Sync** to the toolbar for quick access.

For production, add your API origin to `host_permissions` in `apps/extension/public/manifest.json` (localhost is already included), then rebuild and reload the extension.

### 3. Configure the extension

1. Click the **Signets Sync** icon to open the popup.
2. Set **API URL** — local: `http://localhost:3001`; production: your Render API URL.
3. Set **Sync token** — the same value as `SYNC_TOKEN` in `apps/api/.env` (local) or Render (production).
4. Click **Save settings**. Credentials are stored in Chrome sync storage.

### 4. Capture bookmarks on X

The extension passively intercepts X’s bookmark GraphQL responses while you browse. It captures **photo, video, and animated GIF** media — text-only bookmarks produce no shots. A tweet with several media assets becomes several shots.

1. Log into [x.com](https://x.com) in Chrome (same profile as the extension).
2. Open your bookmarks: `https://x.com/i/bookmarks`
3. **Scroll down** to load more pages. Each loaded page adds shots to an in-memory buffer in that tab.
4. Keep this tab open and **focused** when you sync — sync reads from the active tab.

Captured shots live only in the tab’s memory until you sync. Reloading the bookmarks page clears the buffer; scroll again to re-capture.

### 5. Sync to Signets

1. With the **bookmarks tab active**, open the extension popup.
2. Click **Sync captured shots**.
3. On success you will see something like `Synced N shots (M captured).`

Sync is **manual and on-demand**. It is also **additive only**:

- New shots are added; existing shots get refreshed metadata (caption, author, image URL).
- **Favorites are preserved** across syncs.
- Shots you remove from X bookmarks **stay in Signets** until you delete them via the API (see below).

If sync fails, check that the bookmarks tab is focused, you have scrolled to capture at least one photo shot, the API URL is correct, and the sync token matches the server.

### 6. Browse the gallery

Open the web app (local: `http://localhost:3000`; production: your Workers URL).

The home page is a masonry grid of all synced shots, ordered by bookmark date (newest first).

| Control | What it does |
| ------- | ------------ |
| **Search** | Filter by caption, author handle, or author name |
| **Author** | Filter to one `@handle` |
| **Favorites only** | Show only shots marked as favorites |
| **Density slider** | Adjust column width and thumbnail size |
| **Shot count** | Number of shots matching current filters |

Click any shot to open the **focus overlay** — full-size photo, or motion playback for video/GIF shots (via the API proxy). Use **View on X** in the overlay to open the original post.

If the library is empty, you will see: *“No shots yet. Sync bookmarks from the companion extension.”*

### 7. Curate shots (API only)

The web UI is read-only for curation today. Use the API with your sync token:

```bash
# Mark or unmark a favorite (toggles isFavorite)
curl -X PATCH "https://signets-api.onrender.com/shots/SHOT_ID/favorite" \
  -H "Authorization: Bearer YOUR_SYNC_TOKEN"

# Remove a shot from your library
curl -X DELETE "https://signets-api.onrender.com/shots/SHOT_ID" \
  -H "Authorization: Bearer YOUR_SYNC_TOKEN"
```

Replace `SHOT_ID` with the shot’s UUID from `GET /shots`. After marking favorites, use the **Favorites only** filter in the gallery.

### 8. Ongoing workflow

Typical day-to-day use:

1. Bookmark design posts on X as usual.
2. Periodically open `x.com/i/bookmarks`, scroll to load new bookmarks, and **Sync captured shots**.
3. Browse and filter on the gallery; open posts on X for full context.
4. Optionally favorite or delete shots via curl when curating.

Each API deployment serves one library, keyed by `USER_SLUG` (default `default`). The gallery is public — anyone with the URL can view it; only you (with the sync token) can push or curate data.

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
