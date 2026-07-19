# Library filters in URL query params

All library view knobs — search, author, favorites, view mode, and density — live as query params on `/`, synced via nuqs. Filters compose (e.g. favorites + author + search). Author chips and `@handle` on shots toggle the `author` param. Default values are omitted from the URL. ADR 0005's per-author route is removed with no redirect; old `/authors/{handle}` links 404.
