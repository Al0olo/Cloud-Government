export interface ApiError extends Error {
    statusCode: number;
    errors?: Record<string, string>;
    code?: string;
    data?: any;
  }