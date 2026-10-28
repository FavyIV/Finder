import { Router } from 'express';
import { handleListLocations } from '../controllers/locations.controller';
import { requireAuth } from '../middleware/require-auth';

export const locationsRouter: Router = Router();

locationsRouter.get('/', requireAuth, handleListLocations);
