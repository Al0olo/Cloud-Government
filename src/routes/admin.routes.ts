import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { adminValidation } from '../validations/admin.validation';

const router = Router();
const adminController = new AdminController();

router.use(authMiddleware);
router.use(requireRole(['admin']));

router.get(
  '/users',
  validateRequest(adminValidation.getUsers),
  adminController.getUsers
);

router.get(
  '/applications',
  validateRequest(adminValidation.getApplications),
  adminController.getApplications
);

router.get(
  '/statistics',
  validateRequest(adminValidation.getStatistics),
  adminController.getStatistics
);

export default router;