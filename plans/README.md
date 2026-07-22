# Animation improvement plans

Scoped to **wall masonry + stagger entrance** introduced in uncommitted changes on commit `b4b401b` (flex-column packing, `masonry.ts`, `shot-gallery.tsx` motion wrappers).

| # | Plan | Severity | Status | Scope |
| --- | --- | --- | --- | --- |
| 001 | [wall-tile-opacity-only-entrance](./001-wall-tile-opacity-only-entrance.md) | MEDIUM | DONE | Drop blur + `y` from per-tile wrappers |
| 002 | [wall-single-entrance-layer](./002-wall-single-entrance-layer.md) | MEDIUM | DONE | Remove triple entrance stack |
| 003 | [wall-motion-tokens-in-lib](./003-wall-motion-tokens-in-lib.md) | LOW | DONE | Move wall constants to `motion.ts` |
| 004 | [wall-stagger-by-batch-index](./004-wall-stagger-by-batch-index.md) | LOW | DONE | Stagger by DOM order in batch |

## Recommended execution order

1. **001** — highest perf win on the new code path; simplifies tokens for 003.
2. **002** — depends on 001 only for feel-check clarity (optional); can run in parallel if careful.
3. **003** — refactor after 001 values are final.
4. **004** — polish; independent of 001–003.

## Dependencies

```
001 ──► 003 (export final opacity-only variants)
002 (independent; touches index.tsx + shot-gallery.tsx)
004 (independent; shot-gallery.tsx only)
```

## Out of scope (pre-existing, not introduced in this diff)

- Theme toggle / filter icon `scale: 0.25` swaps
- Canvas `animate-in fade-in` keyframes on tiles
- `UI_SPRING` 350ms global duration
- Filter tray `height` animation (documented intentional tradeoff)

Run a plan with any agent: implement steps verbatim, then feel-check per plan verification section.
