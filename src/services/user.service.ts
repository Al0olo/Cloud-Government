import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { User, UpdateProfileDTO, ChangePasswordDTO } from '../types/user.types';
import { ApplicationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class UserService {
  constructor(private readonly pool: Pool) {}

  async getUserById(id: string): Promise<User> {
    try {
      const result = await this.pool.query(
        `SELECT 
          u.*,
          json_build_object(
            'email', u.notification_preferences->>'email',
            'sms', u.notification_preferences->>'sms',
            'applicationUpdates', u.notification_preferences->>'applicationUpdates',
            'documentRequests', u.notification_preferences->>'documentRequests',
            'statusChanges', u.notification_preferences->>'statusChanges',
            'generalAnnouncements', u.notification_preferences->>'generalAnnouncements'
          ) as notification_preferences
        FROM users u
        WHERE id = $1 AND status != 'deleted'`,
        [id]
      );

      if (!result.rows.length) {
        throw new ApplicationError('User not found', 404);
      }

      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting user by id', { error, userId: id });
      throw error;
    }
  }

  async updateProfile(id: string, data: UpdateProfileDTO): Promise<User> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Update basic info
        const updateResult = await client.query(
          `UPDATE users 
           SET 
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            notification_preferences = COALESCE(
              notification_preferences::jsonb || $4::jsonb,
              notification_preferences
            ),
            updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [
            data.firstName,
            data.lastName,
            data.phone,
            data.notificationPreferences ? JSON.stringify(data.notificationPreferences) : null,
            id
          ]
        );

        if (!updateResult.rows.length) {
          throw new ApplicationError('User not found', 404);
        }

        await client.query('COMMIT');
        return this.mapUserFromDb(updateResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating user profile', { error, userId: id });
      throw error;
    }
  }

  async changePassword(id: string, data: ChangePasswordDTO): Promise<void> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Get current user
        const userResult = await client.query(
          'SELECT password_hash FROM users WHERE id = $1',
          [id]
        );

        if (!userResult.rows.length) {
          throw new ApplicationError('User not found', 404);
        }

        // Verify current password
        const validPassword = await bcrypt.compare(
          data.currentPassword,
          userResult.rows[0].password_hash
        );

        if (!validPassword) {
          throw new ApplicationError('Current password is incorrect', 400);
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(data.newPassword, salt);

        // Update password
        await client.query(
          `UPDATE users 
           SET 
            password_hash = $1,
            updated_at = NOW()
           WHERE id = $2`,
          [newPasswordHash, id]
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error changing password', { error, userId: id });
      throw error;
    }
  }

  private mapUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      role: dbUser.role,
      status: dbUser.status,
      notificationPreferences: dbUser.notification_preferences,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      lastLoginAt: dbUser.last_login_at
    };
  }
}