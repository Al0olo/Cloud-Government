import { Response } from 'express';
import { ValidationError } from 'joi';
import { logger } from './logger';
import { ApiError } from './api-error'
export class ErrorUtils {
  static handleValidationError(res: Response, error: ValidationError) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      const key = detail.path.join('.');
      errors[key] = detail.message;
    });

    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      errors,
    });
  }

  static handleDatabaseError(res: Response, error: any) {
    logger.error('Database error:', error);

    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
      });
    }

    // Handle foreign key violations
    if (error.code === '23503') {
      return res.status(400).json({
        status: 'error',
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced resource does not exist',
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
    });
  }

  static handleAuthenticationError(res: Response, error: any) {
    return res.status(401).json({
      status: 'error',
      code: 'AUTHENTICATION_ERROR',
      message: error.message || 'Authentication failed',
    });
  }

  static handleFileUploadError(res: Response, error: any) {
    const errorMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File size exceeds limit',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_PART_COUNT: 'Too many parts',
    };

    return res.status(400).json({
      status: 'error',
      code: 'FILE_UPLOAD_ERROR',
      message: errorMessages[error.code] || 'File upload failed',
    });
  }

  static isOperationalError(error: Error): boolean {
    if (error instanceof ApiError) {
      return error.statusCode < 500;
    }
    return false;
  }

  static handleError(error: Error): void {
    if (this.isOperationalError(error)) {
      logger.warn('Operational error:', error);
    } else {
      logger.error('Programming error:', error);
      // You might want to send notifications for non-operational errors
      // notificationService.notifyDevelopers(error);
    }
  }
}