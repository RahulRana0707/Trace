import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

type StructuredExceptionBody = {
  errorMessage?: string;
  message?: string | string[];
  data?: unknown;
};

/** Renders every thrown HttpException as `{ status: "error", data, errorMessage }`, matching apps/web/lib/api-response.ts. */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'object' && body !== null) {
      const structured = body as StructuredExceptionBody;
      if (structured.errorMessage) {
        response.status(status).json({
          status: 'error',
          data: structured.data ?? null,
          errorMessage: structured.errorMessage,
        });
        return;
      }
      const message = Array.isArray(structured.message)
        ? structured.message[0]
        : structured.message;
      response.status(status).json({
        status: 'error',
        data: null,
        errorMessage: message ?? exception.message,
      });
      return;
    }

    response
      .status(status)
      .json({ status: 'error', data: null, errorMessage: exception.message });
  }
}
