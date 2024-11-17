import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError } from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = {
      abortEarly: false, // Include all errors
      allowUnknown: true, // Ignore unknown props
      stripUnknown: true // Remove unknown props
    };

    try {
      const { error, value } = schema.validate(
        {
          body: req.body,
          query: req.query,
          params: req.params
        },
        validationOptions
      );

      if (error) {
        const validationErrors: Record<string, string> = {};

        error.details.forEach((detail) => {
          const path = detail.path
            .filter((item) => item !== 'body' && item !== 'query' && item !== 'params')
            .join('.');
          validationErrors[path] = detail.message;
        });

        logger.warn('Validation error', {
          errors: validationErrors,
          path: req.path
        });

        return res.status(400).json({
          message: 'Validation error',
          errors: validationErrors
        });
      }

      // Replace request properties with validated versions
      req.body = value.body;
      req.query = value.query;
      req.params = value.params;

      return next();
    } catch (err) {
      logger.error('Validation middleware error', { error: err });
      return res.status(500).json({
        message: 'Internal server error during validation'
      });
    }
  };
};