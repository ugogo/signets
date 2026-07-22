import type { ReactNode } from 'react';

import { motion, useReducedMotion } from 'motion/react';

import {
  EMPTY_STATE_STAGGER,
  PAGE_ITEM_VARIANTS,
  REDUCED_MOTION_FADE,
  UI_SPRING,
} from '@/lib/motion';
import { cn } from '@/lib/utils';

interface StaggerEntranceProps {
  children: ReactNode;
  className?: string;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerEntrance({ children, className }: StaggerEntranceProps) {
  return (
    <motion.div
      animate="visible"
      className={cn(className)}
      initial="hidden"
      variants={EMPTY_STATE_STAGGER}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const variants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: REDUCED_MOTION_FADE },
      }
    : {
        hidden: PAGE_ITEM_VARIANTS.hidden,
        visible: {
          ...PAGE_ITEM_VARIANTS.visible,
          transition: UI_SPRING,
        },
      };

  return (
    <motion.div className={cn(className)} variants={variants}>
      {children}
    </motion.div>
  );
}
