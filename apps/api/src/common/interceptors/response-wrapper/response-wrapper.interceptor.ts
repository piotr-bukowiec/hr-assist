import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { SuccessResponse } from './response-wrapper.types';

@Injectable()
export class ResponseWrapperInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T | null>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T | null>> {
    const ctx = context.switchToHttp();
    const response: Response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        const { statusCode } = response;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (statusCode === HttpStatus.NO_CONTENT) {
          response.status(HttpStatus.OK);
        }

        return {
          ok: true as const,
          data: data ?? null,
          statusCode,
          errors: null,
        };
      }),
    );
  }
}
