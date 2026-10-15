import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../../interceptors/response-wrapper/response-wrapper.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { method, url } = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    let errorMessages: [string, ...string[]] = ['Internal server error'];

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: string | string[] }).message;
      if (Array.isArray(msg) && msg.length > 0) {
        errorMessages = msg as [string, ...string[]];
      } else if (typeof msg === 'string') {
        errorMessages = [msg];
      }
    } else if (typeof exceptionResponse === 'string') {
      errorMessages = [exceptionResponse];
    } else if (exception instanceof Error) {
      errorMessages = [exception.message];
    }

    const errorBody: ErrorResponse = {
      ok: false,
      data: null,
      statusCode: status,
      errors: errorMessages,
    };

    this.logger.error(
      `${method} ${url} ${status}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    response.status(status).json(errorBody);
  }
}
