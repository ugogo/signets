# 001 — Use opacity-only wall tile entrance

- **Status**: DONE
- **Commit**: b4b401b
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 2 files, ~25 lines

## Problem

The new wall stagger entrance animates **every tile** with `filter: blur()` and Motion `y` shorthand. On first load this can be 20–40 simultaneous wrappers, each animating blur + translate on the main thread.

Current code in `apps/web/src/features/library/components/shot-gallery.tsx:41–44`:

```tsx
const WALL_ITEM_VARIANTS = {
  hidden: { filter: 'blur(2px)', opacity: 0, y: 8 },
  visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
} as const;
```

And usage at `shot-gallery.tsx:193–214` spreads `WALL_ITEM_VARIANTS` into `initial` / `animate`.

AUDIT.md §5: animate `transform` and `opacity` only; keep transition-time blur under 20px and note it is expensive at scale; Motion `x`/`y` shorthands are not hardware-accelerated.

The reduced-motion branch already drops movement (`opacity` only) — full motion should match that discipline with a GPU-friendly property set.

## Target

Wall tile entrance uses **opacity only** on the wrapper `motion.div`. Stagger timing unchanged.

```tsx
const WALL_ITEM_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;
```

Reduced motion stays:

```tsx
initial={shouldAnimate ? { opacity: 0 } : false}
animate={{ opacity: 1 }}
transition={WALL_REDUCED_MOTION_FADE} // { duration: 0.12, ease: 'easeOut' }
```

Full motion:

```tsx
initial={shouldAnimate ? WALL_ITEM_VARIANTS.hidden : false}
animate={WALL_ITEM_VARIANTS.visible}
transition={{ ...WALL_ENTRANCE_SPRING, delay }}
```

Do **not** add `transform`, `y`, or `filter` on per-tile wrappers.

## Repo conventions to follow

- Shared motion tokens live in `apps/web/src/lib/motion.ts` (`UI_SPRING`, `PAGE_ITEM_VARIANTS`, `REDUCED_MOTION_FADE`).
- Reduced motion branching via `useReducedMotion()` — see `apps/web/src/components/stagger-entrance.tsx:37–48`.
- Easing token in CSS: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` in `apps/web/src/styles.css:10`.

## Steps

1. In `apps/web/src/features/library/components/shot-gallery.tsx`, replace `WALL_ITEM_VARIANTS` hidden/visible with opacity-only objects (remove `filter` and `y`).
2. Confirm the `motion.div` wrapper at ~line 193 does not pass `y`, `filter`, or transform props in `initial` / `animate` for the non-reduced branch.
3. Leave `STAGGER_DELAY`, `MAX_STAGGER_DELAY`, `WALL_ENTRANCE_SPRING`, and `enteredIdsRef` logic unchanged.

## Boundaries

- Do NOT change masonry layout, `packIntoColumns`, or load-more behavior.
- Do NOT change `index.tsx` view-mode wrapper animation in this plan.
- Do NOT add new dependencies.
- If `WALL_ITEM_VARIANTS` has already been moved to `motion.ts` by another plan, edit it there instead — do not duplicate.

## Verification

- **Mechanical**: `cd apps/web && pnpm exec vitest run src/features/library/lib/canvas-geometry.test.ts` — all tests pass.
- **Feel check** (Wall view, normal motion):
  - Hard refresh with 20+ shots: tiles fade in with stagger; no visible blur puff or upward slide per tile.
  - Click **Load more**: only new bottom tiles fade in; existing tiles do not shift or re-animate.
  - DevTools → Performance → record first load; confirm no long `Filter` / `Composite` spikes scaling with tile count (compare before/after if possible).
  - DevTools → Rendering → **Emulate CSS media feature `prefers-reduced-motion: reduce`**: tiles fade without movement; stagger delays are 0.
- **Done when**: wall tile wrappers animate opacity only, stagger + load-more entrance behavior preserved, reduced motion respected.
