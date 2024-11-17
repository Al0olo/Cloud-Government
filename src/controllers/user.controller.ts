import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';
import { ApplicationError } from '../utils/errors';

export class UserController {
  constructor(private readonly userService: UserService) {
    // Bind methods to ensure correct 'this' context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  // Declare methods with proper types
  public getProfile: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.user!.id);
      res.json(user);
    } catch (error) {
      logger.error('Error getting user profile', { error, userId: req.user!.id });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  };

  public updateProfile: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = await this.userService.updateProfile(req.user!.id, req.body);
      res.json(user);
    } catch (error) {
      logger.error('Error updating user profile', { error, userId: req.user!.id });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to update profile' });
    }
  };

  public changePassword: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      await this.userService.changePassword(req.user!.id, req.body);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      logger.error('Error changing password', { error, userId: req.user!.id });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to change password' });
    }
  };
}