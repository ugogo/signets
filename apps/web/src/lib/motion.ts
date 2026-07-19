/** Critically damped UI spring — no overshoot (Apple damping 1.0, ~0.35s response). */
export const UI_SPRING = {
  bounce: 0,
  duration: 0.35,
  type: 'spring',
} as const;

/** Momentum handoff — slight bounce after flicks (Apple damping ~0.8). */
export const MOMENTUM_SPRING = {
  bounce: 0.2,
  duration: 0.4,
  type: 'spring',
} as const;

/** Fast opacity cross-fade when springs are replaced (reduced motion). */
export const REDUCED_MOTION_FADE = { duration: 0.2, ease: 'easeOut' } as const;

/** Subtle view-mode exit — softer than enter, fixed translateY. */
export const VIEW_EXIT = {
  filter: 'blur(4px)',
  opacity: 0,
  y: -12,
} as const;

/** Staggered page enter for semantic chunks. */
export const PAGE_ITEM_VARIANTS = {
  hidden: { filter: 'blur(4px)', opacity: 0, y: 12 },
  visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
} as const;

export const PAGE_STAGGER = {
  visible: { transition: { staggerChildren: 0.1 } },
} as const;
