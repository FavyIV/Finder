/**
 * Application-level error. Services throw this; the error-handler middleware
 * converts it into the standard { error: { code, message } } response envelope.
 *
 * @param code    Stable UPPER_SNAKE_CASE string the frontend can switch on.
 * @param message Human-readable description for logging / development.
 * @param httpStatus HTTP status code to send to the client.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
