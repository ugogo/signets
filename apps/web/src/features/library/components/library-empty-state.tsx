import type { ReactNode } from 'react';

import { Text } from 'pickle-ui/text';

import { StaggerEntrance, StaggerItem } from '@/components/stagger-entrance';

import { SurfaceCard } from './media-card';

interface LibraryEmptyStateProps {
  message: string;
  title?: string;
  variant?: 'minimal' | 'panel';
  icon?: ReactNode;
}

export function LibraryEmptyState({
  icon,
  message,
  title = 'Nothing here yet',
  variant = 'panel',
}: LibraryEmptyStateProps) {
  const content = (
    <StaggerEntrance
      className={
        variant === 'panel'
          ? 'flex flex-col items-center gap-4'
          : 'flex flex-col items-center gap-3'
      }
    >
      {icon ? <StaggerItem>{icon}</StaggerItem> : null}
      <StaggerItem>
        <div className="flex max-w-sm flex-col gap-1 text-center">
          <Text weight="bold">{title}</Text>
          <Text tone="muted">{message}</Text>
        </div>
      </StaggerItem>
    </StaggerEntrance>
  );

  if (variant === 'panel') {
    return (
      <SurfaceCard className="flex flex-col items-center justify-center px-8 py-16 text-center">
        {content}
      </SurfaceCard>
    );
  }

  return content;
}
