import { Request, Response } from 'express';
import { Pool } from 'pg';
import {
  ApplicationCreateDTO,
  ApplicationUpdateDTO,
  ApplicationType,
  ApplicationStatus,
  DocumentDTO
} from '../types/application.types';
import { storageService } from '../services/storage.service';
import { sendNotification } from '../services/notification.service';
import { ApplicationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ApplicationController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createApplication(
    req: Request<{}, {}, ApplicationCreateDTO>,
    res: Response
  ) {
    const { type, data } = req.body;
    const userId = req.user!.id;

    try {
      // Start database transaction
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Create application
        const applicationResult = await client.query(
          `INSERT INTO applications (
            user_id,
            type,
            status,
            data,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *`,
          [userId, type, 'draft', data]
        );

        const application = applicationResult.rows[0];

        // Handle document uploads if any
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files) {
            // Upload to S3
            const uploadResult = await storageService.uploadToS3(file);

            // Save document reference
            await client.query(
              `INSERT INTO documents (
                application_id,
                type,
                path,
                status,
                created_at
              ) VALUES ($1, $2, $3, $4, NOW())`,
              [application.id, file.fieldname, uploadResult.Location, 'pending']
            );
          }
        }

        await client.query('COMMIT');

        // Send notification
        await sendNotification({
          type: 'application_created',
          userId,
          applicationId: application.id,
          data: {
            applicationType: type,
            status: 'draft'
          }
        });

        // Log success
        logger.info(`Application created`, {
          userId,
          applicationId: application.id,
          type
        });

        res.status(201).json(application);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Application creation failed', {
        error,
        userId,
        type
      });
      
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Failed to create application' });
    }
  }

  async getApplications(req: Request, res: Response) {
    const userId = req.user!.id;
    const { status, type, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      let query = `
        SELECT 
          a.*,
          json_agg(json_build_object(
            'id', d.id,
            'type', d.type,
            'path', d.path,
            'status', d.status,
            'created_at', d.created_at
          )) as documents
        FROM applications a
        LEFT JOIN documents d ON a.id = d.application_id
        WHERE a.user_id = $1
      `;

      const queryParams: any[] = [userId];
      let paramCounter = 2;

      if (status) {
        query += ` AND a.status = $${paramCounter}`;
        queryParams.push(status);
        paramCounter++;
      }

      if (type) {
        query += ` AND a.type = $${paramCounter}`;
        queryParams.push(type);
        paramCounter++;
      }

      query += `
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      queryParams.push(limit, offset);

      const result = await this.pool.query(query, queryParams);

      // Get total count for pagination
      const countResult = await this.pool.query(
        'SELECT COUNT(*) FROM applications WHERE user_id = $1',
        [userId]
      );

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / Number(limit));

      res.json({
        applications: result.rows,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          hasMore: Number(page) < totalPages
        }
      });
    } catch (error) {
      logger.error('Failed to fetch applications', {
        error,
        userId
      });
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  }

  async getApplication(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
      const result = await this.pool.query(
        `SELECT 
          a.*,
          json_agg(json_build_object(
            'id', d.id,
            'type', d.type,
            'path', d.path,
            'status', d.status,
            'created_at', d.created_at
          )) as documents
        FROM applications a
        LEFT JOIN documents d ON a.id = d.application_id
        WHERE a.id = $1 AND a.user_id = $2
        GROUP BY a.id`,
        [id, userId]
      );

      if (!result.rows.length) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Get application history
      const historyResult = await this.pool.query(
        `SELECT * FROM application_history
        WHERE application_id = $1
        ORDER BY created_at DESC`,
        [id]
      );

      const application = result.rows[0];
      application.history = historyResult.rows;

      res.json(application);
    } catch (error) {
      logger.error('Failed to fetch application', {
        error,
        applicationId: id,
        userId
      });
      res.status(500).json({ message: 'Failed to fetch application' });
    }
  }

  async updateApplication(
    req: Request<{ id: string }, {}, ApplicationUpdateDTO>,
    res: Response
  ) {
    const { id } = req.params;
    const { data, status } = req.body;
    const userId = req.user!.id;

    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Check if application exists and belongs to user
        const checkResult = await client.query(
          'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        if (!checkResult.rows.length) {
          throw new ApplicationError('Application not found', 404);
        }

        const currentApplication = checkResult.rows[0];

        // Update application
        const updateResult = await client.query(
          `UPDATE applications 
          SET 
            data = COALESCE($1, data),
            status = COALESCE($2, status),
            updated_at = NOW()
          WHERE id = $3 AND user_id = $4
          RETURNING *`,
          [data, status, id, userId]
        );

        // Record history
        await client.query(
          `INSERT INTO application_history (
            application_id,
            user_id,
            action,
            previous_status,
            new_status,
            notes,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            id,
            userId,
            'update',
            currentApplication.status,
            status || currentApplication.status,
            'Application updated'
          ]
        );

        // Handle document uploads if any
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files) {
            const uploadResult = await storageService.uploadToS3(file);
            await client.query(
              `INSERT INTO documents (
                application_id,
                type,
                path,
                status,
                created_at
              ) VALUES ($1, $2, $3, $4, NOW())`,
              [id, file.fieldname, uploadResult.Location, 'pending']
            );
          }
        }

        await client.query('COMMIT');

        // Send notification if status changed
        if (status && status !== currentApplication.status) {
          await sendNotification({
            type: 'application_status_changed',
            userId,
            applicationId: id,
            data: {
              previousStatus: currentApplication.status,
              newStatus: status
            }
          });
        }

        logger.info(`Application updated`, {
          userId,
          applicationId: id,
          status
        });

        res.json(updateResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to update application', {
        error,
        applicationId: id,
        userId
      });

      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ message: error.message });
      }

      res.status(500).json({ message: 'Failed to update application' });
    }
  }

  async deleteApplication(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Check if application exists and belongs to user
        const checkResult = await client.query(
          'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        if (!checkResult.rows.length) {
          throw new ApplicationError('Application not found', 404);
        }

        // Delete documents
        await client.query(
          'DELETE FROM documents WHERE application_id = $1',
          [id]
        );

        // Delete history
        await client.query(
          'DELETE FROM application_history WHERE application_id = $1',
          [id]
        );

        // Delete application
        await client.query(
          'DELETE FROM applications WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        await client.query('COMMIT');

        logger.info(`Application deleted`, {
          userId,
          applicationId: id
        });

        res.status(204).send();
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to delete application', {
        error,
        applicationId: id,
        userId
      });

      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ message: error.message });
      }

      res.status(500).json({ message: 'Failed to delete application' });
    }
  }
}