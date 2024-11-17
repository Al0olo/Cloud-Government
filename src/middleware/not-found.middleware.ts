import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Resource not found:', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userId: req.user?.id,
  });

  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
  });
};

// src/middleware/error-logger.middleware.ts
