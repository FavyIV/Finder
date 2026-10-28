import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import type { Role } from '@prisma/client';

/**
 * Middleware factory for role-based authorization.
 * Verifies that the authenticated user's role is in the list of allowed roles.
 * Must be mounted after `requireAuth`.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'You do not have permission to perform this action.', 403);
    }

    next();
  };
}
