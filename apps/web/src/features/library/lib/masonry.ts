/** Aspect ratio (width / height) used for tiles whose real size is unknown. */
export const FALLBACK_ASPECT = 4 / 5;

/**
 * How many `columnWidth` columns fit in `containerWidth` with `gap` between
 * them. Independent of item count so appending tiles does not change the
 * column count (unlike CSS multi-column, which rebalances on every append).
 */
export function columnsForWidth(
  containerWidth: number,
  columnWidth: number,
  gap: number,
): number {
  if (containerWidth <= 0 || columnWidth <= 0) {
    return 0;
  }
  return Math.max(
    1,
    Math.floor((containerWidth + gap) / (columnWidth + gap)),
  );
}

/**
 * Assign each item index to a column via shortest-column packing.
 * Prefix-stable when `columnCount` is fixed: re-running after appending items
 * keeps the same column for every earlier index.
 */
export function packIntoColumns(
  aspects: number[],
  columnCount: number,
  columnWidth: number,
  gap: number,
): number[][] {
  if (columnCount <= 0 || aspects.length === 0) {
    return [];
  }

  const columns = Array.from({ length: columnCount }, () => [] as number[]);
  const columnHeights = new Array<number>(columnCount).fill(0);

  for (let index = 0; index < aspects.length; index += 1) {
    let target = 0;
    for (let column = 1; column < columnCount; column += 1) {
      if (columnHeights[column] < columnHeights[target]) {
        target = column;
      }
    }

    const aspect = aspects[index];
    const height = columnWidth / (aspect > 0 ? aspect : FALLBACK_ASPECT);
    columns[target].push(index);
    columnHeights[target] += height + gap;
  }

  return columns;
}
