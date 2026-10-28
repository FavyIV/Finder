import type { Request, Response, NextFunction } from 'express';
import {
  createFoundListingSchema,
  searchFoundListingsQuerySchema,
  updateFoundListingSchema,
} from '../schemas/found-listings.schema';
import * as foundListingsService from '../services/found-listings.service';
import { uploadImage } from '../lib/cloudinary/cloudinary';
import { AppError } from '../errors/app-error';

export async function handleCreateFoundListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
    }

    if (!req.file) {
      throw new AppError('PHOTO_REQUIRED', 'A photo of the found item is required.', 400);
    }

    const input = createFoundListingSchema.parse(req.body);
    const photoUrl = await uploadImage(req.file.buffer);

    const listing = await foundListingsService.createFoundListing(req.user.id, input, photoUrl);

    res.status(201).json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function handleSearchFoundListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = searchFoundListingsQuerySchema.parse(req.query);
    const result = await foundListingsService.searchFoundListings(query);

    res.status(200).json({
      data: result.items,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleGetFoundListingById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('INVALID_ID', 'Listing ID is required.', 400);
    }

    const listing = await foundListingsService.getFoundListingById(id);
    res.status(200).json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateFoundListing(
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

    const input = updateFoundListingSchema.parse(req.body);

    let photoUrl: string | undefined;
    if (req.file) {
      photoUrl = await uploadImage(req.file.buffer);
    }

    const updated = await foundListingsService.updateFoundListing(req.user.id, id, input, photoUrl);

    res.status(200).json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function handleClaimFoundListing(
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

    const claimed = await foundListingsService.claimFoundListing(req.user.id, id);
    res.status(200).json({ data: claimed });
  } catch (error) {
    next(error);
  }
}
