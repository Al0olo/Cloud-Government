import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { applicationValidation } from '../validations/application.validation';
import { applicationFiles } from '../middleware/upload.middleware';
import { pool } from '../config/database';

const router = Router();

// Initialize controller with database pool
const applicationController = new ApplicationController(pool);

router.use(authMiddleware); // Protect all application routes

// Application CRUD routes
router.post(
  '/',
  applicationFiles,
  validateRequest(applicationValidation.createApplication),
  applicationController.createApplication.bind(applicationController) // Important: bind the context
);

router.get(
  '/',
  validateRequest(applicationValidation.getApplications),
  applicationController.getApplications.bind(applicationController)
);

router.get(
  '/:id',
  validateRequest(applicationValidation.getApplication),
  applicationController.getApplication.bind(applicationController)
);

router.put(
  '/:id',
  applicationFiles,
  validateRequest(applicationValidation.updateApplication),
  applicationController.updateApplication.bind(applicationController)
);

router.delete(
  '/:id',
  validateRequest(applicationValidation.deleteApplication),
  applicationController.deleteApplication.bind(applicationController)
);

// Document routes
// router.post(
//   '/:id/documents',
//   applicationFiles,
//   validateRequest(applicationValidation.uploadDocuments),
//   applicationController.uploadDocuments.bind(applicationController)
// );

// router.delete(
//   '/:id/documents/:documentId',
//   validateRequest(applicationValidation.deleteDocument),
//   applicationController.deleteDocument.bind(applicationController)
// );

// // Status routes
// router.patch(
//   '/:id/status',
//   requireRole(['staff', 'admin']),
//   validateRequest(applicationValidation.updateStatus),
//   applicationController.updateStatus.bind(applicationController)
// );

export default router;