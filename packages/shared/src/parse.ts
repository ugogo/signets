import type { ZodType, ZodIssue } from 'zod';

export class SchemaValidationError extends Error {
  constructor(
    message: string,
    readonly issues: ZodIssue[],
  ) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export function parseWithSchema<T extends ZodType>(
  schema: T,
  data: unknown,
  message = 'Validation failed',
): T['_output'] {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new SchemaValidationError(message, result.error.issues);
  }

  return result.data;
}

export async function parseJsonResponse<T extends ZodType>(
  schema: T,
  response: Response,
  message = 'Invalid API response',
): Promise<T['_output']> {
  const data: unknown = await response.json();
  return parseWithSchema(schema, data, message);
}
