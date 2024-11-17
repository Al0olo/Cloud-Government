import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { logger } from '../utils/logger';

interface RateLimiterOptions extends Partial<Options> {
  windowMs?: number;
  max?: number;
  message?: string;
}

export const rateLimiter = (options: RateLimiterOptions): RateLimitRequestHandler => {
  const defaultOptions: RateLimiterOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // handler: (req, res) => {
    //   logger.warn('Rate limit exceeded', {
    //     ip: req.ip,
    //     path: req.path
    //   });
      
    //   res.status(429).json({
    //     message: options.message || 'Too many requests, please try again later'
    //   });
    // },
    // skip: (req) => {
    //   // Skip rate limiting for specific cases if needed
    //   return false;
    // },
    // keyGenerator: (req) => {
    //   // Use IP address as default key
    //   return req.ip;
    // }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// Example rate limiter configurations
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: 'API rate limit exceeded'
});