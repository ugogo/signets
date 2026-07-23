import { describe, expect, it } from 'vitest';

import { formatCursorPreview } from '../src/capture-log.js';

describe('formatCursorPreview', () => {
  it('returns none for missing cursors', () => {
    expect(formatCursorPreview(undefined)).toBe('none');
  });

  it('shortens long cursors for readable logs', () => {
    const preview = formatCursorPreview(
      'DAAACgGBGedb3Vx__9sKAAIZ5g4QENc99AcAAwAAIAIAAA',
    );
    expect(preview).toContain('…');
    expect(preview.length).toBeLessThan(40);
  });
});
