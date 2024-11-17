import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/document.service';
import { StorageService } from '../services/storage.service';
import { validateRequest } from '../middleware/validate.middleware';
import { documentValidation } from '../validations/document.validation';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { pool } from '../config/database';

const router = Router();

const storageService = new StorageService();
const documentService = new DocumentService(pool, storageService);
const documentController = new DocumentController(documentService);

router.use(authMiddleware);

router.post(
  '/:applicationId',
  upload.single('file'),
  validateRequest(documentValidation.uploadDocument),
  documentController.uploadDocument
);

router.get(
  '/:id',
  validateRequest(documentValidation.getDocument),
  documentController.getDocument
);

router.patch(
  '/:id/verify',
  requireRole(['staff', 'admin']),
  validateRequest(documentValidation.verifyDocument),
  documentController.verifyDocument
);

router.delete(
  '/:id',
  validateRequest(documentValidation.deleteDocument),
  documentController.deleteDocument
);

export default router;