import { describe, expect, it } from 'vitest';

import { chooseColumnCount, computeMasonryLayout } from './canvas-grid';
import { columnsForWidth, FALLBACK_ASPECT, packIntoColumns } from './masonry';
import {
  clampScale,
  clampTranslate,
  computeFitScale,
  computeInitialScale,
  computePanConstraints,
  zoomAtPoint,
} from './use-pan-zoom';
import { tileInRect, visibleContentRect } from './use-visible-rect';

const VIEWPORT = { height: 600, width: 800 };

describe('chooseColumnCount', () => {
  it('returns zero columns for no tiles', () => {
    expect(chooseColumnCount(0, VIEWPORT, 240, FALLBACK_ASPECT)).toBe(0);
  });

  it('never uses more columns than tiles', () => {
    expect(
      chooseColumnCount(2, { height: 100, width: 4000 }, 240, FALLBACK_ASPECT),
    ).toBeLessThanOrEqual(2);
  });

  it('uses more columns for wider viewports', () => {
    const wide = chooseColumnCount(
      40,
      { height: 400, width: 1600 },
      240,
      FALLBACK_ASPECT,
    );
    const tall = chooseColumnCount(
      40,
      { height: 1600, width: 400 },
      240,
      FALLBACK_ASPECT,
    );
    expect(wide).toBeGreaterThan(tall);
  });

  it('trims columns when biased below 1 (more vertical)', () => {
    const neutral = chooseColumnCount(40, VIEWPORT, 240, FALLBACK_ASPECT, 1);
    const biased = chooseColumnCount(40, VIEWPORT, 240, FALLBACK_ASPECT, 0.6);
    expect(biased).toBeLessThanOrEqual(neutral);
    expect(biased).toBeGreaterThanOrEqual(1);
  });
});

describe('columnsForWidth', () => {
  it('returns zero for non-positive dimensions', () => {
    expect(columnsForWidth(0, 240, 12)).toBe(0);
    expect(columnsForWidth(800, 0, 12)).toBe(0);
  });

  it('fits as many columns as the container allows', () => {
    // (800 + 12) / (240 + 12) = 3.22 → 3
    expect(columnsForWidth(800, 240, 12)).toBe(3);
  });

  it('does not depend on item count (stable under append)', () => {
    const width = 1000;
    const columnWidth = 200;
    const gap = 12;
    expect(columnsForWidth(width, columnWidth, gap)).toBe(
      columnsForWidth(width, columnWidth, gap),
    );
  });
});

describe('packIntoColumns', () => {
  it('returns no columns for empty input', () => {
    expect(packIntoColumns([], 3, 240, 12)).toEqual([]);
  });

  it('drops each tile into the shortest column', () => {
    // Three equal tiles into two columns: third stacks under the first.
    const packed = packIntoColumns([1, 1, 1], 2, 240, 12);
    expect(packed).toEqual([[0, 2], [1]]);
  });

  it('keeps earlier assignments when new items are appended', () => {
    const firstBatch = [2, 0.5, 1, 1.2, 0.8, 1.5];
    const secondBatch = [...firstBatch, 0.9, 1.1, 0.7];
    const columns = 3;

    const before = packIntoColumns(firstBatch, columns, 240, 12);
    const after = packIntoColumns(secondBatch, columns, 240, 12);

    for (let column = 0; column < columns; column += 1) {
      expect(after[column].slice(0, before[column].length)).toEqual(
        before[column],
      );
    }

    const placed = new Set(after.flat());
    expect(placed.size).toBe(secondBatch.length);
    for (let index = 0; index < secondBatch.length; index += 1) {
      expect(placed.has(index)).toBe(true);
    }
  });
});

describe('computeMasonryLayout', () => {
  it('returns an empty layout for no tiles', () => {
    expect(computeMasonryLayout([], VIEWPORT, 240, 16)).toEqual({
      columns: 0,
      content: { height: 0, width: 0 },
      tiles: [],
    });
  });

  it('honours each tile aspect ratio for its height', () => {
    const layout = computeMasonryLayout([2, 0.5], VIEWPORT, 240, 16);
    const wide = layout.tiles[0];
    const tall = layout.tiles[1];
    // height = columnWidth / aspect
    expect(wide.height).toBeCloseTo(240 / 2);
    expect(tall.height).toBeCloseTo(240 / 0.5);
    expect(wide.width).toBe(240);
  });

  it('drops each tile into the shortest column', () => {
    // Two columns, three equal tiles: the third stacks under the first.
    const layout = computeMasonryLayout([1, 1, 1], VIEWPORT, 240, 16);
    expect(layout.columns).toBeGreaterThanOrEqual(2);
    const first = layout.tiles[0];
    const third = layout.tiles[2];
    expect(third.left).toBe(first.left);
    expect(third.top).toBeGreaterThan(first.top);
  });

  it('sizes content width from the chosen column count', () => {
    const layout = computeMasonryLayout([1, 1, 1, 1], VIEWPORT, 240, 16);
    expect(layout.content.width).toBe(
      layout.columns * 240 + (layout.columns - 1) * 16,
    );
  });
});

describe('computeFitScale', () => {
  it('scales down oversized content to fit the padded viewport', () => {
    const scale = computeFitScale(
      { height: 2000, width: 2000 },
      { height: 600, width: 800 },
      50,
    );
    // Height is the limiting axis: (600 - 100) / 2000 = 0.25
    expect(scale).toBeCloseTo(0.25);
  });

  it('never upscales past 1:1', () => {
    const scale = computeFitScale(
      { height: 100, width: 100 },
      { height: 600, width: 800 },
      50,
    );
    expect(scale).toBe(1);
  });
});

describe('computeInitialScale', () => {
  const viewport = { height: 600, width: 800 };

  it('fills the viewport width for tall, narrow content (bigger than contain-fit)', () => {
    const content = { height: 4000, width: 500 };
    const min = computeFitScale(content, viewport, 40);
    const initial = computeInitialScale(content, viewport, 40, min, 8);
    // Width-fill = (800 - 80) / 500 = 1.44, and that beats the contain-fit.
    expect(initial).toBeCloseTo((800 - 80) / 500);
    expect(initial).toBeGreaterThan(min);
  });

  it('never exceeds the max scale', () => {
    const content = { height: 2000, width: 50 };
    const initial = computeInitialScale(content, viewport, 40, 0.1, 8);
    expect(initial).toBe(8);
  });

  it('opens tighter with a boost > 1', () => {
    const content = { height: 4000, width: 500 };
    const min = computeFitScale(content, viewport, 40);
    const plain = computeInitialScale(content, viewport, 40, min, 8);
    const boosted = computeInitialScale(content, viewport, 40, min, 8, 1.75);
    expect(boosted).toBeCloseTo(plain * 1.75);
    expect(boosted).toBeGreaterThan(plain);
  });
});

describe('clampScale', () => {
  it('bounds the scale between min and max', () => {
    expect(clampScale(0.1, 0.5, 4)).toBe(0.5);
    expect(clampScale(9, 0.5, 4)).toBe(4);
    expect(clampScale(2, 0.5, 4)).toBe(2);
  });
});

describe('clampTranslate', () => {
  const viewport = { height: 600, width: 800 };

  it('centres content smaller than the viewport', () => {
    const result = clampTranslate(
      { scale: 1, x: 999, y: -999 },
      { height: 200, width: 400 },
      viewport,
      40,
    );
    expect(result.x).toBe((800 - 400) / 2);
    expect(result.y).toBe((600 - 200) / 2);
  });

  it('keeps oversized content edges within the padding', () => {
    const content = { height: 2000, width: 2000 };
    const tooFarRight = clampTranslate(
      { scale: 1, x: 500, y: 0 },
      content,
      viewport,
      40,
    );
    expect(tooFarRight.x).toBe(40);

    const tooFarLeft = clampTranslate(
      { scale: 1, x: -5000, y: 0 },
      content,
      viewport,
      40,
    );
    expect(tooFarLeft.x).toBe(viewport.width - 40 - content.width);
  });
});

describe('computePanConstraints', () => {
  const viewport = { height: 600, width: 800 };

  it('pins both axes to centre when content fits', () => {
    const content = { height: 200, width: 400 };
    const constraints = computePanConstraints(content, viewport, 1, 40);
    expect(constraints.left).toBe(constraints.right);
    expect(constraints.top).toBe(constraints.bottom);
    expect(constraints.left).toBe((800 - 400) / 2);
    expect(constraints.top).toBe((600 - 200) / 2);
  });

  it('exposes a travel range for oversized content', () => {
    const content = { height: 2000, width: 2000 };
    const constraints = computePanConstraints(content, viewport, 1, 40);
    expect(constraints.right).toBe(40);
    expect(constraints.left).toBe(viewport.width - 40 - content.width);
    expect(constraints.left).toBeLessThan(constraints.right);
  });
});

describe('zoomAtPoint', () => {
  it('keeps the point under the cursor visually fixed', () => {
    const before = { scale: 1, x: 0, y: 0 };
    const point = { x: 100, y: 100 };
    const after = zoomAtPoint(before, 2, point);

    // Content coordinate under the cursor before and after must match.
    const contentXBefore = (point.x - before.x) / before.scale;
    const contentXAfter = (point.x - after.x) / after.scale;
    expect(contentXAfter).toBeCloseTo(contentXBefore);
  });
});

describe('visibleContentRect', () => {
  const viewport = { height: 600, width: 800 };

  it('maps the viewport into content space (identity transform)', () => {
    const rect = visibleContentRect(0, 0, 1, viewport, 0);
    expect(rect.left).toBeCloseTo(0);
    expect(rect.top).toBeCloseTo(0);
    expect(rect.right).toBeCloseTo(800);
    expect(rect.bottom).toBeCloseTo(600);
  });

  it('shrinks the content window as scale grows and adds margin', () => {
    const rect = visibleContentRect(0, 0, 2, viewport, 50);
    expect(rect.left).toBe(-50);
    expect(rect.right).toBe(800 / 2 + 50);
    expect(rect.bottom).toBe(600 / 2 + 50);
  });
});

describe('tileInRect', () => {
  const rect = { bottom: 300, left: 100, right: 400, top: 100 };

  it('includes overlapping tiles', () => {
    expect(
      tileInRect({ height: 50, left: 380, top: 120, width: 50 }, rect),
    ).toBe(true);
  });

  it('excludes tiles fully outside the rect', () => {
    expect(
      tileInRect({ height: 50, left: 500, top: 120, width: 50 }, rect),
    ).toBe(false);
    expect(tileInRect({ height: 20, left: 120, top: 0, width: 20 }, rect)).toBe(
      false,
    );
  });
});
