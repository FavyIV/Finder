import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/app-error';
import type { JwtPayload } from '../services/auth.service';

/**
 * Middleware that authenticates requests via Bearer JWT.
 * Decodes the token and attaches `req.user = { id, role }`.
 * Rejects unauthenticated requests with 401.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication token is required.', 401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Authentication token is required.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch {
    throw new AppError('INVALID_TOKEN', 'Session token is invalid or has expired.', 401);
  }
}
