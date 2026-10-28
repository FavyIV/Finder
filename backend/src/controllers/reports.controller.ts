import type { Request, Response, NextFunction } from 'express';
import {
  createReportSchema,
  listAdminReportsSchema,
  resolveReportSchema,
} from '../schemas/reports.schema';
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

export async function handleListAdminReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = listAdminReportsSchema.parse(req.query);
    const result = await reportsService.listAdminReports(query);

    res.json({
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleResolveReport(
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
      throw new AppError('INVALID_ID', 'Report ID is required.', 400);
    }

    const input = resolveReportSchema.parse(req.body);
    const updated = await reportsService.resolveReport(req.user.id, id, input.status);

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
