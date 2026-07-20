# Zod validation at every runtime boundary

Signets validates cross-boundary data with **Zod 4**. Schemas live where the contract is shared; app-local schemas stay in the app that owns them.

**`@signets/shared`:** cross-app contracts only — shots, sync payloads, and list query/response shapes used by the API, web, and extension.

**App-local schemas:** extension chrome messages, web URL search params, and API-only query shapes (e.g. x-media proxy) live in their respective apps.

**API:** a `ZodValidationPipe` validates body, query, and route params. Invalid input returns HTTP 400 with a normalized envelope: `{ statusCode: 400, error: 'Validation failed', issues: ZodIssue[] }`.

**Web:** every `fetch` response is parsed with shared schemas. URL search params are validated with web-local Zod schemas; nuqs parsers delegate to those schemas.

**Extension:** chrome runtime messages use extension-local Zod schemas. API sync I/O is parsed with shared schemas. Shots parsed from X bookmark JSON are validated with `syncShotInputSchema` at capture time — invalid shots are dropped before sync.

**Considered:** class-validator DTOs in NestJS (rejected — duplicates Zod, splits contract); lenient GET query handling (rejected — typos silently return unfiltered results); nuqs as URL state source of truth (rejected — `favorites` and API query params would drift); staying on Zod 3 (rejected — upgrade bundled with schema consolidation); incremental rollout (rejected — single PR avoids half-validated main); placing all schemas in shared (rejected — extension and web-only shapes do not belong in the shared package).
