import { describe, expect, it } from 'vitest';

import { listShotsQuerySchema } from '../src/index.js';

describe('listShotsQuerySchema', () => {
  it('rejects an invalid cursor', () => {
    const result = listShotsQuerySchema.safeParse({
      cursor: 'not-a-cursor',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid limit', () => {
    const result = listShotsQuerySchema.safeParse({
      limit: '999',
    });

    expect(result.success).toBe(false);
  });
});
