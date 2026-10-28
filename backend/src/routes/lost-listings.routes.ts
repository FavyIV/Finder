import { Router } from 'express';
import {
  handleCreateLostListing,
  handleListLostListings,
  handleGetLostListingById,
  handleUpdateLostListing,
} from '../controllers/lost-listings.controller';
import { requireAuth } from '../middleware/require-auth';

export const lostListingsRouter: Router = Router();

lostListingsRouter.use(requireAuth);

lostListingsRouter.post('/', handleCreateLostListing);
lostListingsRouter.get('/', handleListLostListings);
lostListingsRouter.get('/:id', handleGetLostListingById);
lostListingsRouter.patch('/:id', handleUpdateLostListing);
