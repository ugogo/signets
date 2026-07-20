import type { ZodIssue } from 'zod';

export type ValidationErrorEnvelope = {
  statusCode: 400;
  error: 'Validation failed';
  issues: ZodIssue[];
};

export function validationErrorEnvelope(
  issues: ZodIssue[],
): ValidationErrorEnvelope {
  return {
    statusCode: 400,
    error: 'Validation failed',
    issues,
  };
}
