import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';

const mediaCardClassName =
  'relative isolate overflow-hidden rounded-xl bg-background shadow-(--shadow-border) [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:outline-none';

type MediaCardProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  'as' | 'children' | 'className'
> & {
  as?: T;
  children?: ReactNode;
  className?: string;
};

type SurfaceCardProps = ComponentPropsWithoutRef<'div'>;

/**
 * Shot tile shell: one outer shadow ring. Suppresses the global img outline
 * so corners don't ghost into a double edge.
 */
export function MediaCard<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: MediaCardProps<T>) {
  const Comp = as ?? 'div';
  return <Comp className={cn(mediaCardClassName, className)} {...props} />;
}

/** Elevated panel with a single shadow-border ring. */
export function SurfaceCard({ className, ...props }: SurfaceCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card shadow-(--shadow-border) transition-shadow duration-150 ease-out hover:shadow-(--shadow-border-hover)',
        className,
      )}
      {...props}
    />
  );
}
