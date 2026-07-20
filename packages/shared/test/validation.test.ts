import { describe, expect, it } from 'vitest';

import { listShotsQuerySchema, validationErrorEnvelope } from '../src/index.js';

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

describe('validationErrorEnvelope', () => {
  it('returns a normalized 400 envelope', () => {
    const result = listShotsQuerySchema.safeParse({ limit: '999' });
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(validationErrorEnvelope(result.error.issues)).toEqual({
      statusCode: 400,
      error: 'Validation failed',
      issues: result.error.issues,
    });
  });
});
