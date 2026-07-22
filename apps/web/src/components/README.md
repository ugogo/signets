# Shared UI components

Wrappers and app chrome built on [pickle-ui](https://github.com/ugogo/pickle-ui). Import these from `@/components/*` in routes and features.

## Style rule

- Routes and feature **containers** may import pickle-ui directly using built-in variants and props.
- Do **not** pass visual `className` overrides to pickle-ui primitives outside wrapper files.
- If pickle defaults are not enough, add or extend a named component here (or in `features/*/components/` for domain-specific shells).

Before adding a new wrapper, check this folder — avoid duplicating the same pickle composition.

## Wrappers

| Component | Use when |
|---|---|
| `input-group` | Search / token fields with a single shadow-border shell |
| `segment-control` | Mutually exclusive toggles (e.g. wall / canvas view) |
| `link-button` | Inline ghost `@author` links |
| `stagger-entrance` | Staggered empty-state / page entrance motion |
| `app-providers` | Query client + theme at the app root |
| `not-found` | 404 page |

Theme controls live in `@/features/theme/*`.

## Pickle-ui backlog

Candidates to upstream into pickle-ui (Signets uses local wrappers until then):

1. **SegmentControl** / toggle group
2. **Dialog** (modal shell with focus trap)
3. **Skeleton**
4. **EmptyState**
5. **Chip** / filter pill variant on `Button`
