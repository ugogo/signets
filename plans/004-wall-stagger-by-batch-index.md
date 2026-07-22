# 004 — Stagger wall tiles by batch order not global index

- **Status**: DONE
- **Commit**: b4b401b
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, ~15 lines

## Problem

Stagger delay uses the shot's **global array index** (`shot-gallery.tsx:187–189`):

```tsx
Math.min(
  (index - batchStart) * STAGGER_DELAY,
  MAX_STAGGER_DELAY,
),
```

Masonry packing (`packIntoColumns`) assigns index 0 to column 0, 1 to column 1, etc. Global index order does not match visual reading order down each column. After the first row, delays feel arbitrary — e.g. index 4 in column 0 animates before index 3 in column 2, producing a uneven cascade.

Stagger is decorative (AUDIT.md §7) but should still read as a wave through the **new batch**, not a global list offset.

## Target

Compute delay from **position within the current batch**, in column-major render order (the order tiles mount in the DOM):

```tsx
const batchIndex = index - batchStart;
const delay =
  !shouldAnimate || reducedMotion
    ? 0
    : Math.min(batchIndex * WALL_STAGGER_DELAY, WALL_MAX_STAGGER_DELAY);
```

Wait — that's the same formula already using `index - batchStart`. The issue is batch index follows **pack order** (shortest column), not DOM order.

Fix: assign stagger from **enumeration order in the rendered column loops**:

```tsx
let batchSequence = 0;
// inside columns.map → columnShots.map:
const delay =
  !shouldAnimate || reducedMotion
    ? 0
    : Math.min(batchSequence++ * WALL_STAGGER_DELAY, WALL_MAX_STAGGER_DELAY);
```

Reset `batchSequence = 0` once per render before the column loops (not inside `useMemo` for columns — compute delay inline in JSX or precompute a `Map<shotId, delay>` in `useMemo` keyed by `[shots, batchStart, column layout]`).

Example precomputed map in `useMemo`:

```tsx
const staggerDelays = useMemo(() => {
  const delays = new Map<string, number>();
  let seq = 0;
  for (const columnShots of columns) {
    for (const { index, shot } of columnShots) {
      if (index >= batchStart) {
        delays.set(
          shot.id,
          Math.min(seq * WALL_STAGGER_DELAY, WALL_MAX_STAGGER_DELAY),
        );
        seq += 1;
      }
    }
  }
  return delays;
}, [columns, batchStart]);
```

Usage: `const delay = staggerDelays.get(shot.id) ?? 0`.

Use `WALL_STAGGER_DELAY` / `WALL_MAX_STAGGER_DELAY` from `motion.ts` (plan 003) or local constants if 003 not done yet.

## Repo conventions to follow

- Stagger caps: `EMPTY_STATE_STAGGER` uses 60ms children step in `motion.ts:36–37`; wall uses 20ms — keep wall faster.
- `batchStart` / `enteredIdsRef` pattern in `shot-gallery.tsx:124–139` — do not regress load-more stability.

## Steps

1. Add `staggerDelays` `useMemo` after `columns` memo, depending on `columns`, `batchStart`, and stagger constants.
2. In the tile `motion.div`, replace `(index - batchStart) * STAGGER_DELAY` with `staggerDelays.get(shot.id) ?? 0`.
3. When `!shouldAnimate`, keep `delay: 0` regardless of map.

## Boundaries

- Do NOT change `packIntoColumns` or column count logic.
- Do NOT change entrance variants or spring config.
- Do NOT add new dependencies.

## Verification

- **Mechanical**: existing geometry tests pass; no new tests required.
- **Feel check** (slow-motion or 10% animation speed):
  - First load: stagger reads left-to-right across columns, then continues down each column in DOM order — not “random” jumps between columns deep in the grid.
  - Load more: only appended tiles stagger, wave starts from first new tile in column 0’s bottom, then column 1, etc.
- **Done when**: stagger delay derives from render sequence within the batch, not raw `shots` array index alone.
