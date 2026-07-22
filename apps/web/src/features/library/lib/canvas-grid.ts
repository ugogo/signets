import type { Size } from './use-pan-zoom';

import { FALLBACK_ASPECT } from './masonry';

export interface MasonryLayout {
  columns: number;
  content: Size;
  tiles: PlacedTile[];
}

export interface PlacedTile {
  height: number;
  left: number;
  top: number;
  width: number;
}

/**
 * Pick a column count so the overall masonry roughly matches the viewport
 * shape, keeping fit-to-view from wasting space. `bias` < 1 trims columns to
 * make the canvas taller/more vertical; > 1 widens it.
 */
export function chooseColumnCount(
  count: number,
  viewport: Size,
  columnWidth: number,
  averageAspect: number,
  bias = 1,
): number {
  if (count <= 0) {
    return 0;
  }
  const averageTileHeight = columnWidth / averageAspect;
  const ideal =
    bias *
    Math.sqrt(
      (count * viewport.width * averageTileHeight) /
        (viewport.height * columnWidth),
    );
  return Math.max(1, Math.min(count, Math.round(ideal) || 1));
}

/**
 * Column-balanced masonry: fixed column width, per-tile height from each shot's
 * aspect ratio, every tile dropped into the currently shortest column. This
 * gives the staggered, organic look a uniform grid can't.
 */
export function computeMasonryLayout(
  aspects: number[],
  viewport: Size,
  columnWidth: number,
  gap: number,
  columnBias = 1,
): MasonryLayout {
  const count = aspects.length;
  if (count <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { columns: 0, content: { height: 0, width: 0 }, tiles: [] };
  }

  const averageAspect =
    aspects.reduce((sum, aspect) => sum + aspect, 0) / count;
  const columns = chooseColumnCount(
    count,
    viewport,
    columnWidth,
    averageAspect,
    columnBias,
  );

  const columnHeights = new Array<number>(columns).fill(0);
  const tiles: PlacedTile[] = [];

  for (const aspect of aspects) {
    let target = 0;
    for (let column = 1; column < columns; column += 1) {
      if (columnHeights[column] < columnHeights[target]) {
        target = column;
      }
    }

    const height = columnWidth / (aspect > 0 ? aspect : FALLBACK_ASPECT);
    tiles.push({
      height,
      left: target * (columnWidth + gap),
      top: columnHeights[target],
      width: columnWidth,
    });
    columnHeights[target] += height + gap;
  }

  const contentHeight = Math.max(0, Math.max(...columnHeights) - gap);

  return {
    columns,
    content: {
      height: contentHeight,
      width: columns * columnWidth + (columns - 1) * gap,
    },
    tiles,
  };
}
