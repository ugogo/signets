import type { ZodIssue } from 'zod';

export type ValidationErrorEnvelope = {
  error: 'Validation failed';
  issues: ZodIssue[];
  statusCode: 400;
};

export function validationErrorEnvelope(
  issues: ZodIssue[],
): ValidationErrorEnvelope {
  return {
    error: 'Validation failed',
    issues,
    statusCode: 400,
  };
}
