import { Maximize2, Minus, Plus } from 'lucide-react';
import { Button } from 'pickle-ui/button';
import { Group } from 'pickle-ui/group';

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
    <Group
      aria-label="Canvas zoom"
      className="absolute right-3 top-3"
      orientation="vertical"
    >
      <Button
        aria-label="Zoom in"
        disabled={!isReady}
        onClick={onZoomIn}
        size="icon"
        variant="outline"
      >
        <Plus className="size-4" />
      </Button>
      <Group.Separator orientation="horizontal" />
      <Button
        aria-label="Zoom out"
        disabled={!isReady}
        onClick={onZoomOut}
        size="icon"
        variant="outline"
      >
        <Minus className="size-4" />
      </Button>
      <Group.Separator orientation="horizontal" />
      <Button
        aria-label="Fit all"
        disabled={!isReady}
        onClick={onFit}
        size="icon"
        variant="outline"
      >
        <Maximize2 className="size-4" />
      </Button>
    </Group>
  );
}
