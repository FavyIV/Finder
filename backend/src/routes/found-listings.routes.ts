import { Router } from 'express';
import {
  handleCreateFoundListing,
  handleSearchFoundListings,
  handleGetFoundListingById,
  handleUpdateFoundListing,
  handleClaimFoundListing,
} from '../controllers/found-listings.controller';
import { handleCreateReport } from '../controllers/reports.controller';
import { requireAuth } from '../middleware/require-auth';
import { requireRole } from '../middleware/require-role';
import { uploadSinglePhoto } from '../middleware/upload';
import { Role } from '@prisma/client';

export const foundListingsRouter: Router = Router();

foundListingsRouter.get('/', requireAuth, handleSearchFoundListings);
foundListingsRouter.get('/:id', requireAuth, handleGetFoundListingById);
foundListingsRouter.post('/', requireAuth, uploadSinglePhoto, handleCreateFoundListing);
foundListingsRouter.patch('/:id', requireAuth, uploadSinglePhoto, handleUpdateFoundListing);
foundListingsRouter.post(
  '/:id/claim',
  requireAuth,
  requireRole(Role.SECURITY, Role.ADMIN),
  handleClaimFoundListing,
);
foundListingsRouter.post('/:id/report', requireAuth, handleCreateReport);
foundListingsRouter.post('/:id/reports', requireAuth, handleCreateReport);
