import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { authValidation } from '../validations/auth.validation';
import { rateLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), // 5 requests per hour
  validateRequest(authValidation.register),
  authController.register
);

router.post(
  '/login',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  validateRequest(authValidation.login),
  authController.login
);

// router.post(
//   '/forgot-password',
//   rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 requests per hour
//   validateRequest(authValidation.forgotPassword),
//   authController.forgotPassword
// );

// router.post(
//   '/reset-password',
//   rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 requests per hour
//   validateRequest(authValidation.resetPassword),
//   authController.resetPassword
// );

export default router;