import {
  Check,
  Copy,
  Heart,
  LayoutGrid,
  Map,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from 'pickle-ui/button';
import { Slider } from 'pickle-ui/slider';
import { Text } from 'pickle-ui/text';
import { useEffect, useState } from 'react';

import { Input, InputGroup } from '@/components/input-group';
import { SegmentControl } from '@/components/segment-control';
import {
  type ViewMode,
} from '@/features/library/lib/library-search-params';
import { REDUCED_MOTION_FADE } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface LibraryFiltersTrayProps {
  authors: string[];
  curationToken: string;
  density: number;
  favoritesOnly: boolean;
  isCurator: boolean;
  onAuthorToggle: (authorHandle: string) => void;
  onClearCurationToken: () => void;
  onCopyLink: () => void;
  onCurationTokenChange: (token: string) => void;
  onDensityChange: (density: number) => void;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  onSaveCurationToken: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  selectedAuthor: null | string;
  viewMode: ViewMode;
}

export function LibraryFiltersTray({
  authors,
  curationToken,
  density,
  favoritesOnly,
  isCurator,
  onAuthorToggle,
  onClearCurationToken,
  onCopyLink,
  onCurationTokenChange,
  onDensityChange,
  onFavoritesOnlyChange,
  onSaveCurationToken,
  onViewModeChange,
  selectedAuthor,
  viewMode,
}: LibraryFiltersTrayProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const densityTransition = reducedMotion
    ? REDUCED_MOTION_FADE
    : { duration: 0.15, ease: [0.23, 1, 0.32, 1] as const };
  const [copyState, setCopyState] = useState<'copied' | 'idle'>('idle');

  useEffect(() => {
    if (copyState !== 'copied') {
      return;
    }

    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopyLink = () => {
    onCopyLink();
    setCopyState('copied');
  };

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-muted/50 p-2">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <div className="space-y-1">
          <Text as="p" tone="muted" variant="small">
            View
          </Text>
          <SegmentControl
            aria-label="View mode"
            onValueChange={onViewModeChange}
            options={[
              {
                icon: <LayoutGrid className="size-4" />,
                label: 'Wall',
                value: 'wall',
              },
              {
                icon: <Map className="size-4" />,
                label: 'Canvas',
                value: 'canvas',
              },
            ]}
            value={viewMode}
          />
        </div>

        <div className="space-y-1">
          <Text as="p" tone="muted" variant="small">
            Favorites
          </Text>
          <Button
            aria-label="Favorites only"
            aria-pressed={favoritesOnly}
            className={cn(
              'size-8 rounded-xl',
              favoritesOnly && 'shadow-(--shadow-border)',
            )}
            onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
            size="sm"
            variant={favoritesOnly ? 'secondary' : 'outline'}
          >
            <Heart
              className={cn(
                'size-4',
                favoritesOnly && 'fill-current text-red-500',
              )}
            />
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {viewMode === 'wall' ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="min-w-36 space-y-1"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="density"
              transition={densityTransition}
            >
              <Text as="p" tone="muted" variant="small">
                Density
              </Text>
              <div className="flex items-center gap-2 px-0.5">
                <Slider
                  aria-label="Gallery density"
                  className="min-w-0 flex-1"
                  max={100}
                  min={0}
                  onValueChange={(value) => {
                    const next = densityFromSliderValue(value);
                    if (next !== undefined) {
                      onDensityChange(next);
                    }
                  }}
                  step={10}
                  value={[density]}
                />
                <Text
                  as="span"
                  className="w-8 font-mono tabular-nums"
                  tone="muted"
                  variant="small"
                >
                  {density}
                </Text>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="space-y-1">
        <Text as="p" tone="muted" variant="small">
          Authors
        </Text>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {authors.map((handle) => (
            <Button
              aria-pressed={selectedAuthor === handle}
              className={cn(
                'h-7 shrink-0 rounded-full px-2.5 text-xs',
                selectedAuthor === handle && 'shadow-(--shadow-border)',
              )}
              key={handle}
              onClick={() => onAuthorToggle(handle)}
              size="sm"
              variant={selectedAuthor === handle ? 'secondary' : 'outline'}
            >
              @{handle}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-border/60 pt-2">
        <Button
          aria-label="Copy link to this view"
          onClick={handleCopyLink}
          size="sm"
          variant="outline"
        >
          {copyState === 'copied' ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          Copy link
        </Button>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-2">
        <Text as="p" tone="muted" variant="small">
          Curation token
        </Text>
        <Text as="p" tone="muted" variant="small">
          Stored locally in this browser. Same value as the extension sync
          token.
        </Text>
        <InputGroup>
          <Input
            aria-label="Sync token for curation"
            autoComplete="off"
            className="touch-input font-mono text-xs"
            onChange={(event) => onCurationTokenChange(event.target.value)}
            placeholder="Paste sync token…"
            type="password"
            value={curationToken}
          />
        </InputGroup>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSaveCurationToken} size="sm">
            Save token
          </Button>
          {isCurator ? (
            <Button onClick={onClearCurationToken} size="sm" variant="outline">
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function densityFromSliderValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (!Array.isArray(value) || typeof value[0] !== 'number') {
    return undefined;
  }

  return value[0];
}
