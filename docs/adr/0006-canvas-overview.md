# Canvas overview as a second library lens

The library has two views on the same page: **Wall** (vertical masonry, newest first) and **Canvas** (spatial minimap on a pannable, zoomable plane). A header toggle switches between them; search and favorites apply to both. Canvas loads progressively — ghost-outline placeholders for the filtered total, tiles fade in as pages arrive — rather than fetching the whole library upfront. Pan/zoom is bounded with generous padding around content; clicking a shot focuses it in place (enlarged image, metadata strip, link to X). Home Canvas gets a sub-toggle for uniform grid vs author clusters (labelled regions, shots in a mini-grid inside, regions ordered by shot count); author pages get Canvas grid-only. Ship uniform grid first, author clusters second. The density slider is Wall-only.

## Update (2026-07-18) — masonry layout, Motion, vertical bias

Shipped Phase 1 with three deviations from the plan above:

- **Ratio-respecting masonry instead of a uniform grid.** Tiles keep each shot's aspect ratio (`width / height`, falling back to a portrait default when dimensions are unknown) and drop into the shortest column, so the plane reads like the Wall rather than a rigid grid. A `columnBias` (< 1) trims the column count below what the viewport aspect would suggest, biasing the plane taller/more vertical so fewer shots sit side by side. Author clusters (Phase 2) are still pending.
- **Interaction/animation on [Motion](https://motion.dev) (`motion/react`).** The draggable plane is a `motion.div` with `drag` + `dragMomentum` + `dragConstraints`, so pan inertia and bound rubber-banding come from the library instead of a hand-rolled rAF loop. Zoom animates the `scale`/`x`/`y` motion values toward cursor-anchored, clamped targets with a spring. Pure geometry (`computeFitScale`, `clampTranslate`, `zoomAtPoint`, `computePanConstraints`) stays in plain, unit-tested helpers; Motion only consumes their output. Motion is intended for reuse elsewhere in the app.
- **Focus is a centred overlay**, not a literal in-place zoom, matching the Wall's lightbox affordance while still showing the enlarged image, metadata strip, and link to X.

The Canvas is full-bleed (fills the available space) and hides the density slider, as planned.

### Hardening (post-review)

A follow-up perf/bug pass tightened the interaction to stay fluid and correct at scale:

- **Zoom never touches React state.** Drag constraints live in a stable object mutated as `scale` animates (via a motion-value subscription), so a wheel gesture re-renders nothing and bounds always match what's on screen. The container rect is cached instead of measured per wheel tick.
- **Tiles are virtualized.** Only tiles intersecting the (margin-expanded) visible content rect are mounted, tracked on a coalesced rAF, so libraries with thousands of shots don't mount thousands of DOM nodes.
- **Progressive loading is guarded** against a non-advancing page (stops instead of refetching forever) and re-fits when filters swap the content set.
- **Accessibility:** the plane is a focusable `role="application"` with arrow-key pan and `+`/`-`/`0` zoom; the focus overlay is a real modal (`aria-modal`, labelled, focus-trapped, restores focus) and the plane is `inert` behind it; the fill indicator is an `aria-live` status. `prefers-reduced-motion` disables spring zoom and drag momentum.
