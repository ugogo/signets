# 003 — Promote wall entrance tokens to motion.ts

- **Status**: DONE
- **Commit**: b4b401b
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 2 files, ~30 lines

## Problem

The new wall animation defines local constants in `shot-gallery.tsx:30–46`:

```tsx
const STAGGER_DELAY = 0.02;
const MAX_STAGGER_DELAY = 0.36;

const WALL_ENTRANCE_SPRING = {
  bounce: 0,
  duration: 0.22,
  type: 'spring',
} as const;

const WALL_ITEM_VARIANTS = {
  hidden: { filter: 'blur(2px)', opacity: 0, y: 8 },
  visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
} as const;

const WALL_REDUCED_MOTION_FADE = { duration: 0.12, ease: 'easeOut' } as const;
```

AUDIT.md §7: curves and durations should live as shared tokens; parallel near-identical configs drift (wall was tuned faster than `UI_SPRING` / `PAGE_ITEM_VARIANTS` in `motion.ts`).

**Dependency**: Apply plan **001** first if merged — export the post-001 opacity-only variants, not the blur/y version above.

## Target

Add to `apps/web/src/lib/motion.ts`:

```tsx
/** Wall gallery tile entrance — faster than page stagger, no overshoot. */
export const WALL_ENTRANCE_SPRING = {
  bounce: 0,
  duration: 0.22,
  type: 'spring',
} as const;

/** Opacity-only tile fade (GPU-friendly at high tile counts). */
export const WALL_ITEM_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

export const WALL_REDUCED_MOTION_FADE = {
  duration: 0.12,
  ease: 'easeOut',
} as const;

/** Delay between wall tiles in a batch (seconds). */
export const WALL_STAGGER_DELAY = 0.02;

/** Max stagger delay cap for large first pages (seconds). */
export const WALL_MAX_STAGGER_DELAY = 0.36;
```

In `shot-gallery.tsx`, delete local constants and import from `@/lib/motion`. Replace usages:

- `STAGGER_DELAY` → `WALL_STAGGER_DELAY`
- `MAX_STAGGER_DELAY` → `WALL_MAX_STAGGER_DELAY`

## Repo conventions to follow

- Token naming: existing exports `UI_SPRING`, `PAGE_ITEM_VARIANTS`, `EMPTY_STATE_STAGGER` in `apps/web/src/lib/motion.ts`.
- Comment style on `UI_SPRING` line 1: brief purpose + timing note.

## Steps

1. Add exports to `apps/web/src/lib/motion.ts` (use opacity-only `WALL_ITEM_VARIANTS` if plan 001 is done; otherwise add opacity-only here and plan 001 becomes a no-op for variants).
2. Update `shot-gallery.tsx` imports from `@/lib/motion`; remove local `STAGGER_*`, `WALL_*` constant definitions.
3. Grep for duplicate wall motion constants — should be zero outside `motion.ts` and `shot-gallery.tsx` imports.

## Boundaries

- Do NOT change stagger logic, `enteredIdsRef`, or masonry layout.
- Do NOT rename existing `UI_SPRING` / `PAGE_ITEM_VARIANTS` exports.
- Do NOT add new dependencies.

## Verification

- **Mechanical**: `cd apps/web && pnpm exec vitest run src/features/library/lib/canvas-geometry.test.ts` — pass.
- **Feel check**: wall load + load-more animation timing unchanged from before this refactor (same 20ms stagger step, 220ms spring).
- **Done when**: all wall entrance numeric values live in `motion.ts`; `shot-gallery.tsx` imports them.
