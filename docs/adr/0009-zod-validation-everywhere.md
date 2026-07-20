# Zod validation at every runtime boundary

Signets validates all cross-boundary data with **Zod 4** schemas defined in `@signets/shared`. The API, web app, and companion extension parse inputs and outputs through those schemas — no manual type guards, no silent fallbacks on invalid query params, no unchecked `as` casts on fetch responses.

**Shared package:** domain modules (`shots`, `sync`, `library-url`, `extension-messages`) export schemas and inferred types. `@signets/shared` is the only schema home.

**API:** a `ZodValidationPipe` validates body, query, and route params. Invalid input returns HTTP 400 with a normalized envelope: `{ statusCode: 400, error: 'Validation failed', issues: ZodIssue[] }`.

**Web:** every `fetch` response is parsed with shared schemas. URL search params (`author`, `search`, `favorites`, `viewMode`, `density`) are validated through shared Zod schemas; nuqs parsers delegate to those schemas.

**Extension:** chrome runtime messages and API responses use shared Zod schemas. Shots parsed from X bookmark JSON are validated with `syncShotInputSchema` at capture time — invalid shots are dropped before sync.

**Considered:** class-validator DTOs in NestJS (rejected — duplicates Zod, splits contract); lenient GET query handling (rejected — typos silently return unfiltered results); nuqs as URL state source of truth (rejected — `favorites` and API query params would drift); staying on Zod 3 (rejected — upgrade bundled with schema consolidation); incremental rollout (rejected — single PR avoids half-validated main).
