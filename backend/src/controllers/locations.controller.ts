import type { Request, Response, NextFunction } from 'express';
import * as locationsService from '../services/locations.service';

export async function handleListLocations(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const locations = await locationsService.listLocations();
    res.status(200).json({ data: locations });
  } catch (error) {
    next(error);
  }
}
