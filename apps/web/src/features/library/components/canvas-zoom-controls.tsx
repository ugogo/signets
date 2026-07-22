import { Maximize2, Minus, Plus } from 'lucide-react';
import { Button } from 'pickle-ui/button';

interface CanvasZoomControlsProps {
  isReady: boolean;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function CanvasZoomControls({
  isReady,
  onFit,
  onZoomIn,
  onZoomOut,
}: CanvasZoomControlsProps) {
  return (
    <div className="floating-chrome absolute right-3 top-3 flex flex-col gap-1.5 rounded-lg p-1 shadow-[var(--shadow-border)]">
      <Button
        aria-label="Zoom in"
        disabled={!isReady}
        onClick={onZoomIn}
        size="sm"
        variant="outline"
      >
        <Plus className="size-4" />
      </Button>
      <Button
        aria-label="Zoom out"
        disabled={!isReady}
        onClick={onZoomOut}
        size="sm"
        variant="outline"
      >
        <Minus className="size-4" />
      </Button>
      <Button
        aria-label="Fit all"
        disabled={!isReady}
        onClick={onFit}
        size="sm"
        variant="outline"
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}
