import {
  HttpException,
  HttpStatus,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';
import { validationErrorEnvelope } from '@signets/shared';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new HttpException(
        validationErrorEnvelope(result.error.issues),
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.data;
  }
}

export function zodPipe<T extends ZodType>(schema: T): ZodValidationPipe {
  return new ZodValidationPipe(schema);
}
