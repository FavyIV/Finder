import type { Request, Response, NextFunction } from 'express';
import {
  createLostListingSchema,
  updateLostListingSchema,
  queryLostListingsSchema,
} from '../schemas/lost-listings.schema';
import * as lostListingsService from '../services/lost-listings.service';
import { AppError } from '../errors/app-error';

export async function handleCreateLostListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    const input = createLostListingSchema.parse(req.body);
    const listing = await lostListingsService.createLostListing(req.user.id, input);

    res.status(201).json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function handleListLostListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = queryLostListingsSchema.parse(req.query);
    const result = await lostListingsService.listLostListings(query, req.user?.id);

    res.json({
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetLostListingById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('INVALID_ID', 'Lost listing ID is required.', 400);
    }

    const listing = await lostListingsService.getLostListingById(id);

    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateLostListing(
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
      throw new AppError('INVALID_ID', 'Lost listing ID is required.', 400);
    }

    const input = updateLostListingSchema.parse(req.body);
    const updated = await lostListingsService.updateLostListing(req.user.id, id, input);

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
