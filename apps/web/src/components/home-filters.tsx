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
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/60 px-4 py-3">
      <ViewModeToggle onViewModeChange={onViewModeChange} viewMode={viewMode} />
      <Checkbox
        checked={favoritesOnly}
        label="Favorites only"
        onCheckedChange={(checked) => onFavoritesOnlyChange(checked === true)}
      />
      {viewMode === 'wall' ? (
        <label className="flex min-w-48 flex-1 items-center gap-3 text-sm text-muted-foreground">
          <span>Density</span>
          <Slider
            className="w-full"
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
      <Badge variant="secondary">{shotCount} shots</Badge>
    </div>
  );
}
