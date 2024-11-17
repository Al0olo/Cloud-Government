import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import { Pool, DatabaseError } from 'pg';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error caught in error handler:', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userId: req.user?.id,
    },
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      errors: err.errors,
      data: err.code,
    });
  }

  // Handle Joi validation errors
  if (err instanceof ValidationError) {
    const errors: Record<string, string> = {};
    err.details.forEach((detail) => {
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

  // Handle Postgres database errors
  if (err instanceof DatabaseError) {
    logger.error('Database error:', {
      code: err.code,
      message: err.message,
      detail: err.detail,
      schema: err.schema,
      table: err.table,
      constraint: err.constraint,
    });

    // Handle specific database errors
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          status: 'error',
          code: 'DUPLICATE_ENTRY',
          message: 'Resource already exists',
        });
      
      case '23503': // foreign_key_violation
        return res.status(400).json({
          status: 'error',
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced resource does not exist',
        });
      
      case '23502': // not_null_violation
        return res.status(400).json({
          status: 'error',
          code: 'NULL_VIOLATION',
          message: 'Required field is missing',
        });
      
      case '22P02': // invalid_text_representation
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_INPUT',
          message: 'Invalid input format',
        });

      default:
        return res.status(500).json({
          status: 'error',
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
        });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
    });
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    const errorMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_FIELD_KEY: 'Field name is too long',
      LIMIT_FIELD_VALUE: 'Field value is too long',
      LIMIT_FIELD_COUNT: 'Too many fields in form',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field in form',
    };

    return res.status(400).json({
      status: 'error',
      code: 'FILE_UPLOAD_ERROR',
      message: errorMessages[err.message] || 'File upload failed',
    });
  }

  // Handle AWS S3 errors
  if (err.name === 'S3ServiceException') {
    return res.status(500).json({
      status: 'error',
      code: 'STORAGE_ERROR',
      message: 'File storage operation failed',
    });
  }

  // Handle rate limit errors
  if (err.name === 'RateLimitExceeded') {
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    });
  }

  // Log unknown errors with full details in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('Unhandled error:', {
      error: err,
      stack: err.stack,
    });
  }

  // Generic error response for unhandled errors
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Additional utility type for strongly typed error responses
export interface ErrorResponse {
  status: 'error';
  code: string;
  message: string;
  errors?: Record<string, string>;
  data?: any;
  stack?: string;
}

// Utility function to create consistent error responses
export const createErrorResponse = (
  code: string,
  message: string,
  statusCode: number = 500,
  errors?: Record<string, string>,
  data?: any
): ErrorResponse => {
  return {
    status: 'error',
    code,
    message,
    ...(errors && { errors }),
    ...(data && { data }),
    ...(process.env.NODE_ENV === 'development' && { stack: new Error().stack }),
  };
};

// Helper function to determine if an error is operational
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof ApiError) {
    return error.statusCode < 500;
  }
  if (error instanceof DatabaseError) {
    // Consider certain database errors as operational
    const operationalCodes = ['23505', '23503', '23502', '22P02'];
    return operationalCodes.includes(error.message);
  }
  if (error instanceof ValidationError) {
    return true;
  }
  return false;
};