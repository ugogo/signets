import { LayoutGrid, Map } from 'lucide-react';
import { Button } from 'pickle-ui/button';

export type ViewMode = 'canvas' | 'wall';

interface ViewModeToggleProps {
  onViewModeChange: (mode: ViewMode) => void;
  viewMode: ViewMode;
}

export function ViewModeToggle({
  onViewModeChange,
  viewMode,
}: ViewModeToggleProps) {
  return (
    <div
      aria-label="View mode"
      className="inline-flex items-center gap-0.5 rounded-xl bg-card/60 p-0.5 shadow-[var(--shadow-border)]"
      role="group"
    >
      <Button
        aria-pressed={viewMode === 'wall'}
        className="rounded-lg pl-3 pr-2.5"
        onClick={() => onViewModeChange('wall')}
        size="sm"
        variant={viewMode === 'wall' ? 'secondary' : 'ghost'}
      >
        <LayoutGrid className="size-4" />
        Wall
      </Button>
      <Button
        aria-pressed={viewMode === 'canvas'}
        className="rounded-lg pl-3 pr-2.5"
        onClick={() => onViewModeChange('canvas')}
        size="sm"
        variant={viewMode === 'canvas' ? 'secondary' : 'ghost'}
      >
        <Map className="size-4" />
        Canvas
      </Button>
    </div>
  );
}
