export interface SuccessResponse<T> {
  ok: true;
  data: T;
  statusCode: number;
  errors: null;
}

export interface ErrorResponse {
  data: null;
  ok: false;
  errors: [string, ...string[]];
  statusCode: number;
}

export type ResponseWrapper<T> = SuccessResponse<T> | ErrorResponse;
