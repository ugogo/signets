# Platform: TanStack Start frontend + NestJS API, TypeScript everywhere

Signets is a hosted, image-heavy app, built TypeScript front and back but split into two deployables:

- **Frontend:** TanStack Start (SSR/SPA) on **Cloudflare Pages**. Its server-function backend is intentionally unused for data — it is a client of the API.
- **API:** **NestJS** on **Render** (a Node host).
- **Database:** **Neon Postgres** (serverless), accessed via an ORM (Drizzle by default; Prisma acceptable if the Nest ecosystem pull is stronger).
- **Images:** hotlinked in the MVP; **R2** reserved for later hosting (reachable from Node via the S3 API).

NestJS was chosen deliberately over a Cloudflare-Workers backend despite being heavier than a single-user gallery strictly needs. That choice rules out Workers (NestJS needs the Node runtime) and D1 (only reachable via Workers bindings), which is why the database is Neon Postgres rather than D1. Trade-off accepted: two deployables and more backend boilerplate, in exchange for a familiar, well-structured Node backend that scales into the multi-user/premium future.
