import { Badge } from 'pickle-ui/badge';
import { Checkbox } from 'pickle-ui/checkbox';
import { Slider } from 'pickle-ui/slider';

import { type ViewMode, ViewModeToggle } from './view-mode-toggle';

export interface HomeFiltersProps {
  density: number;
  favoritesOnly: boolean;
  onDensityChange: (density: number) => void;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  onViewModeChange: (mode: ViewMode) => void;
  shotCount: number;
  viewMode: ViewMode;
}

export function HomeFilters({
  density,
  favoritesOnly,
  onDensityChange,
  onFavoritesOnlyChange,
  onViewModeChange,
  shotCount,
  viewMode,
}: HomeFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border/60 pb-4">
      <ViewModeToggle onViewModeChange={onViewModeChange} viewMode={viewMode} />

      <Checkbox
        checked={favoritesOnly}
        label="Favorites only"
        onCheckedChange={(checked) => onFavoritesOnlyChange(checked === true)}
      />

      {viewMode === 'wall' ? (
        <label className="flex min-w-52 flex-1 items-center gap-3 text-sm text-muted-foreground">
          <span className="shrink-0">Density</span>
          <Slider
            aria-label="Gallery density"
            className="w-full max-w-xs"
            max={100}
            min={0}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              onDensityChange(next ?? 55);
            }}
            value={[density]}
          />
        </label>
      ) : (
        <div className="flex-1" />
      )}

      <Badge className="font-mono tabular-nums" variant="outline">
        {shotCount.toLocaleString()} shots
      </Badge>
    </div>
  );
}
