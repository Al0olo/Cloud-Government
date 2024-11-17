import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { validateRequest } from '../middleware/validate.middleware';
import { userValidation } from '../validations/user.validation';
import { authMiddleware } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();

// Initialize services and controller
const userService = new UserService(pool);
const userController = new UserController(userService);

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.get(
  '/profile',
  userController.getProfile
);

router.put(
  '/profile',
  validateRequest(userValidation.updateProfile),
  userController.updateProfile
);

router.post(
  '/change-password',
  validateRequest(userValidation.changePassword),
  userController.changePassword
);

export default router;