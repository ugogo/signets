# 002 — Collapse wall entrance to one choreographer

- **Status**: DONE
- **Commit**: b4b401b
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~20 lines

## Problem

Landing the new wall stagger adds a **third** entrance layer on top of existing wrappers:

1. `apps/web/src/routes/index.tsx:150–155` — wall `motion.div` with `initial={viewInitial}` (`filter: blur(4px)`, `opacity: 0`, `y: 12`) and `UI_SPRING` (350ms).
2. `apps/web/src/features/library/components/shot-gallery.tsx:175` — content `motion.div key="content"` with `{...OPACITY_CROSSFADE}` (200ms opacity fade).
3. `shot-gallery.tsx:193–214` — per-tile stagger entrance (new in this change).

On first wall load the user waits through nested blur + slide + opacity + stagger. AUDIT.md §1: stagger is decorative and must not block interaction; stacking entrances on the highest-traffic view compounds latency at the exact moment the user is watching.

## Target

**One choreographer** for wall content entrance: per-tile stagger inside `ShotGallery`. Parent wrappers should not also blur/slide/fade the whole gallery.

### A. `shot-gallery.tsx` — remove content-level crossfade

Replace:

```tsx
{viewKey === 'content' ? (
  <motion.div key="content" {...OPACITY_CROSSFADE}>
```

With a plain div (no entrance animation on the container):

```tsx
{viewKey === 'content' ? (
  <div key="content">
```

Keep `OPACITY_CROSSFADE` on loading / error / empty states only.

### B. `index.tsx` — wall wrapper opacity-only (no blur, no y)

For the wall branch only (`key="wall"`), when `!reducedMotion`:

```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={REDUCED_MOTION_FADE} // { duration: 0.2, ease: 'easeOut' }
```

When `reducedMotion`, same opacity-only crossfade (already `{ opacity: 0 }` / `{ opacity: 1 }`).

Do **not** apply blur or `y` on the wall wrapper. Canvas branch (`key="canvas"`) may keep current `viewInitial` / `viewExit` / `viewTransition` — out of scope unless needed for symmetry.

## Repo conventions to follow

- Loading ↔ content uses `OPACITY_CROSSFADE` in `apps/web/src/lib/motion.ts:41–46` for state swaps, not for every child inside content.
- `useReducedMotion()` branching pattern: `apps/web/src/routes/index.tsx:78–83`.

## Steps

1. In `shot-gallery.tsx`, change the `viewKey === 'content'` wrapper from `motion.div` + `OPACITY_CROSSFADE` to a static `div`. Leave loading/error/empty `motion.div` crossfades intact.
2. In `index.tsx`, add wall-specific `initial` / `animate` / `exit` / `transition` variables (or inline) that use opacity-only values for the `key="wall"` `motion.div`. Do not reuse `viewInitial` / `viewExit` (they include blur + y).
3. Verify canvas branch still uses existing `viewInitial`, `viewExit`, `viewTransition`.

## Boundaries

- Do NOT remove per-tile stagger in `shot-gallery.tsx`.
- Do NOT change canvas view-mode animation in this plan beyond ensuring it still compiles.
- Do NOT change filter tray, dialog, or theme motion.
- Do NOT add new dependencies.

## Verification

- **Mechanical**: `cd apps/web && pnpm exec tsc --noEmit` (or project typecheck script) — no errors.
- **Feel check**:
  - Hard refresh Wall view: tiles stagger in cleanly; the **page does not** blur/slide as a whole before tiles appear.
  - Toggle Wall ↔ Canvas: wall enter/exit is a quick opacity crossfade (~200ms), not a 350ms blur slide.
  - Load more: only new tiles animate; no full-gallery flash.
  - `prefers-reduced-motion: reduce`: wall wrapper and tiles opacity-only; no vertical movement on wrapper or tiles (after plan 001 if applied).
- **Done when**: wall first paint has a single visible entrance choreography (tile stagger), wrapper layers do not stack blur/y/spring on top.
