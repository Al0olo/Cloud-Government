// src/utils/api-error.ts
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly errors?: Record<string, string>;
  
    constructor(
      statusCode: number,
      message: string,
      code: string = 'API_ERROR',
      errors?: Record<string, string>
    ) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.errors = errors;
      this.name = 'ApiError';
  
      // Capture stack trace
      Error.captureStackTrace(this, this.constructor);
    }
  
    // Static factory methods for common error types
    static badRequest(
      message: string,
      code: string = 'BAD_REQUEST',
      errors?: Record<string, string>
    ): ApiError {
      return new ApiError(400, message, code, errors);
    }
  
    static unauthorized(
      message: string = 'Unauthorized',
      code: string = 'UNAUTHORIZED'
    ): ApiError {
      return new ApiError(401, message, code);
    }
  
    static forbidden(
      message: string = 'Forbidden',
      code: string = 'FORBIDDEN'
    ): ApiError {
      return new ApiError(403, message, code);
    }
  
    static notFound(
      message: string = 'Resource not found',
      code: string = 'NOT_FOUND'
    ): ApiError {
      return new ApiError(404, message, code);
    }
  
    static methodNotAllowed(
      message: string = 'Method not allowed',
      code: string = 'METHOD_NOT_ALLOWED'
    ): ApiError {
      return new ApiError(405, message, code);
    }
  
    static conflict(
      message: string = 'Conflict',
      code: string = 'CONFLICT',
      errors?: Record<string, string>
    ): ApiError {
      return new ApiError(409, message, code, errors);
    }
  
    static unprocessableEntity(
      message: string = 'Unprocessable Entity',
      code: string = 'UNPROCESSABLE_ENTITY',
      errors?: Record<string, string>
    ): ApiError {
      return new ApiError(422, message, code, errors);
    }
  
    static tooManyRequests(
      message: string = 'Too many requests',
      code: string = 'TOO_MANY_REQUESTS'
    ): ApiError {
      return new ApiError(429, message, code);
    }
  
    static internal(
      message: string = 'Internal server error',
      code: string = 'INTERNAL_SERVER_ERROR'
    ): ApiError {
      return new ApiError(500, message, code);
    }
  
    // Utility method to get error response object
    toJSON(): Record<string, any> {
      return {
        status: 'error',
        statusCode: this.statusCode,
        code: this.code,
        message: this.message,
        ...(this.errors && { errors: this.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      };
    }
  }