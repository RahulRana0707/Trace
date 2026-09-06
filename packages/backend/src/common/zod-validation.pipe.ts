import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/** Validates @Body()/@Query() against a zod schema; mirrors the {validation} shape apps/web's Next routes already throw on zod failure. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        errorMessage: 'Validation failed',
        data: { validation: parsed.error.flatten() },
      });
    }
    return parsed.data;
  }
}
