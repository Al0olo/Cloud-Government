export class ApplicationError extends Error {
    statusCode: number;
    
    constructor(message: string, statusCode: number = 500) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApplicationError';
    }
  }
  
  export class ValidationError extends ApplicationError {
    errors: Record<string, string>;
    
    constructor(message: string, errors: Record<string, string>) {
      super(message, 400);
      this.name = 'ValidationError';
      this.errors = errors;
    }
  }
  
  export class AuthenticationError extends ApplicationError {
    constructor(message: string = 'Authentication required') {
      super(message, 401);
      this.name = 'AuthenticationError';
    }
  }
  
  export class AuthorizationError extends ApplicationError {
    constructor(message: string = 'Access denied') {
      super(message, 403);
      this.name = 'AuthorizationError';
    }
  }

//   export class ApiError extends ApplicationError {
//     constructor(message: string = 'API Error') {
//       super(message, 405);
//       this.name = 'APIError';
//     }
//   }