import { Router } from 'express';
import { handleCreateFoundListing } from '../controllers/found-listings.controller';
import { requireAuth } from '../middleware/require-auth';
import { uploadSinglePhoto } from '../middleware/upload';

export const foundListingsRouter: Router = Router();

foundListingsRouter.post('/', requireAuth, uploadSinglePhoto, handleCreateFoundListing);
