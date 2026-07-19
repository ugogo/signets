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
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5"
      role="group"
    >
      <Button
        aria-pressed={viewMode === 'wall'}
        onClick={() => onViewModeChange('wall')}
        size="sm"
        variant={viewMode === 'wall' ? 'secondary' : 'ghost'}
      >
        <LayoutGrid className="size-4" />
        Wall
      </Button>
      <Button
        aria-pressed={viewMode === 'canvas'}
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
