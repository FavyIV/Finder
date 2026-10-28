import { Router } from 'express';
import { handleListAdminReports, handleResolveReport } from '../controllers/reports.controller';
import { requireAuth } from '../middleware/require-auth';
import { requireRole } from '../middleware/require-role';
import { Role } from '@prisma/client';

export const adminReportsRouter: Router = Router();

adminReportsRouter.use(requireAuth);
adminReportsRouter.use(requireRole(Role.ADMIN));

adminReportsRouter.get('/', handleListAdminReports);
adminReportsRouter.patch('/:id', handleResolveReport);
