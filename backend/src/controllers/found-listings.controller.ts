import type { Request, Response, NextFunction } from 'express';
import { createFoundListingSchema } from '../schemas/found-listings.schema';
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
