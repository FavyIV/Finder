import type { Request, Response, NextFunction } from 'express';
import { createReportSchema } from '../schemas/reports.schema';
import * as reportsService from '../services/reports.service';
import { AppError } from '../errors/app-error';

export async function handleCreateReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('INVALID_ID', 'Listing ID is required.', 400);
    }

    const input = createReportSchema.parse(req.body);
    const report = await reportsService.createReport(req.user.id, id, input.reason);

    res.status(201).json({ data: report });
  } catch (error) {
    next(error);
  }
}
