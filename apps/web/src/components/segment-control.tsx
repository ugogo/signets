import type { ReactNode } from 'react';

import { Button } from 'pickle-ui/button';

import { cn } from '@/lib/utils';

const trackClassName =
  'inline-flex h-8 shrink-0 items-center gap-0.5 rounded-xl bg-muted/50 p-0.5';

const itemClassName = 'h-7 rounded-lg px-2.5';

export interface SegmentOption<T extends string> {
  icon?: ReactNode;
  label: ReactNode;
  value: T;
}

interface SegmentControlProps<T extends string> {
  'aria-label': string;
  onValueChange: (value: T) => void;
  options: SegmentOption<T>[];
  value: T;
}

export function SegmentControl<T extends string>({
  'aria-label': ariaLabel,
  onValueChange,
  options,
  value,
}: SegmentControlProps<T>) {
  return (
    <div aria-label={ariaLabel} className={trackClassName} role="group">
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <Button
            aria-pressed={selected}
            className={cn(
              itemClassName,
              selected && 'shadow-(--shadow-border)',
            )}
            key={option.value}
            onClick={() => onValueChange(option.value)}
            size="sm"
            variant={selected ? 'secondary' : 'ghost'}
          >
            {option.icon}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
