import multer from 'multer';
import { Request } from 'express';
import { ApplicationError } from '../utils/errors';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(new ApplicationError(`File type ${file.mimetype} is not supported`, 400));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Maximum 5 files per request
  }
});

// Middleware for handling multiple files with specific fields
export const applicationFiles = upload.fields([
  { name: 'constructionPlans', maxCount: 3 },
  { name: 'sitePlan', maxCount: 1 },
  { name: 'propertyDeed', maxCount: 1 },
  { name: 'identification', maxCount: 1 },
  { name: 'other', maxCount: 5 }
]);