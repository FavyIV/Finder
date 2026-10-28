import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

/**
 * Global error-handling middleware. Must be registered last in app.ts.
 *
 * Converts AppError and ZodError into the standard response envelope:
 *   { error: { code: string, message: string } }
 *
 * Controllers never send error responses themselves — they throw AppError
 * and let this handler do the formatting.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      },
    });
    return;
  }

  // Unexpected errors — log server-side, return a generic message to the client.
  console.error('[error-handler] Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}
