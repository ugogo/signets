import type { ComponentProps } from 'react';

import { Button } from 'pickle-ui/button';

import { cn } from '@/lib/utils';

type LinkButtonProps = Omit<ComponentProps<typeof Button>, 'variant'> & {
  active?: boolean;
};

/** Ghost text control styled like an inline author link. */
export function LinkButton({
  active = false,
  className,
  size = 'sm',
  ...props
}: LinkButtonProps) {
  return (
    <Button
      className={cn(
        'h-auto w-fit rounded-md p-0 font-mono text-xs font-bold',
        active ? 'text-primary' : 'text-foreground hover:text-primary',
        className,
      )}
      size={size}
      variant="ghost"
      {...props}
    />
  );
}
