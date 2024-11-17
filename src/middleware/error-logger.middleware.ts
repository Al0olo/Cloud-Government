import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/api-error';

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  statusCode?: number;
  code?: string;
  errors?: Record<string, string>;
  request: {
    method: string;
    path: string;
    params: Record<string, any>;
    query: Record<string, any>;
    body: any;
    headers: Record<string, string | string[] | undefined>;
    ip: string | undefined;
    userId: string | undefined;
  };
  timestamp: string;
}

export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorDetails: ErrorDetails = {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    request: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      },
      ip: req.ip,
      userId: req.user?.id,
    },
    timestamp: new Date().toISOString(),
  };

  // Add ApiError specific properties
  if (err instanceof ApiError) {
    errorDetails.statusCode = err.statusCode;
    errorDetails.code = err.code;
    errorDetails.errors = err.errors;
  }

  // Log sensitive data differently in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('API Error (Development):', {
      ...errorDetails,
      request: {
        ...errorDetails.request,
        headers: {
          ...errorDetails.request.headers,
          cookie: '[REDACTED]',
          authorization: '[REDACTED]',
        },
      },
    });
  } else {
    // Production logging - remove sensitive data
    const { body, headers, ...safeRequest } = errorDetails.request;
    logger.error('API Error:', {
      ...errorDetails,
      stack: undefined, // Remove stack trace in production
      request: {
        ...safeRequest,
        // Include safe request body fields if needed
        body: body ? '[REDACTED]' : undefined,
      },
    });
  }

  next(err);
};

// Optional: Create a type-safe error logging utility
export const logError = (
  error: Error | ApiError,
  context?: Record<string, any>
): void => {
  const errorLog: Partial<ErrorDetails> = {
    name: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ApiError) {
    errorLog.statusCode = error.statusCode;
    errorLog.code = error.code;
    errorLog.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development') {
    errorLog.stack = error.stack;
  }

  if (context) {
    logger.error('Application Error:', { ...errorLog, context });
  } else {
    logger.error('Application Error:', errorLog);
  }
};

// Helper function to sanitize error objects for logging
const sanitizeError = (error: any): Partial<ErrorDetails> => {
  const sanitized: Partial<ErrorDetails> = {
    name: error.name || 'UnknownError',
    message: error.message || 'An unknown error occurred',
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ApiError) {
    sanitized.statusCode = error.statusCode;
    sanitized.code = error.code;
    sanitized.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development') {
    sanitized.stack = error.stack;
  }

  return sanitized;
};

// Helper function to sanitize request data for logging
const sanitizeRequest = (req: Request): Record<string, any> => {
  return {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userId: req.user?.id,
    // Add other safe fields as needed
  };
};

// Export additional utilities
export const errorLoggingUtils = {
  logError,
  sanitizeError,
  sanitizeRequest,
};