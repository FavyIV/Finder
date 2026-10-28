import type { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { AppError } from '../errors/app-error';

export async function handleRegister(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleGetMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}
