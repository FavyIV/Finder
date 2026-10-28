import { Router } from 'express';
import {
  handleCreateFoundListing,
  handleSearchFoundListings,
  handleGetFoundListingById,
} from '../controllers/found-listings.controller';
import { requireAuth } from '../middleware/require-auth';
import { uploadSinglePhoto } from '../middleware/upload';

export const foundListingsRouter: Router = Router();

foundListingsRouter.get('/', requireAuth, handleSearchFoundListings);
foundListingsRouter.get('/:id', requireAuth, handleGetFoundListingById);
foundListingsRouter.post('/', requireAuth, uploadSinglePhoto, handleCreateFoundListing);
