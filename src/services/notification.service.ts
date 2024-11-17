import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface NotificationPayload {
  type: NotificationType;
  userId: string;
  applicationId: string;
  data: Record<string, any>;
}

type NotificationType = 
  | 'application_created'
  | 'application_updated'
  | 'application_status_changed'
  | 'document_uploaded'
  | 'review_completed';

export class NotificationService {
  private pool: Pool;
  private mailer: nodemailer.Transporter;

  constructor(pool: Pool) {
    this.pool = pool;
    
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Store notification in database
      const result = await this.pool.query(
        `INSERT INTO notifications (
          user_id,
          type,
          application_id,
          data,
          created_at,
          read_at
        ) VALUES ($1, $2, $3, $4, NOW(), NULL)
        RETURNING *`,
        [payload.userId, payload.type, payload.applicationId, payload.data]
      );

      // Get user email
      const userResult = await this.pool.query(
        'SELECT email, first_name, notification_preferences FROM users WHERE id = $1',
        [payload.userId]
      );

      const user = userResult.rows[0];

      // Check user notification preferences
      if (user.notification_preferences?.[payload.type]?.email !== false) {
        // Send email notification
        await this.sendEmail(
          user.email,
          this.getNotificationTemplate(payload, user)
        );
      }

      logger.info('Notification sent', {
        notificationId: result.rows[0].id,
        type: payload.type,
        userId: payload.userId
      });
    } catch (error) {
      logger.error('Failed to send notification', {
        error,
        payload
      });
      throw error;
    }
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      await this.mailer.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: template.subject,
        html: template.body
      });
    } catch (error) {
      logger.error('Failed to send email', { error, to });
      throw error;
    }
  }

  private getNotificationTemplate(
    payload: NotificationPayload,
    user: { first_name: string }
  ): EmailTemplate {
    const templates: Record<NotificationType, (data: any) => EmailTemplate> = {
        application_created: (data) => ({
            subject: 'Your Application Has Been Created',
            body: `
          <h2>Hello ${user.first_name},</h2>
          <p>Your application has been successfully created.</p>
          <p>Application Type: ${data.applicationType}</p>
          <p>Status: ${data.status}</p>
        `
        }),
        application_status_changed: (data) => ({
            subject: 'Application Status Updated',
            body: `
          <h2>Hello ${user.first_name},</h2>
          <p>Your application status has been updated.</p>
          <p>Previous Status: ${data.previousStatus}</p>
          <p>New Status: ${data.newStatus}</p>
        `
        }),
        application_updated: function (data: any): EmailTemplate {
            throw new Error('Function not implemented.');
        },
        document_uploaded: function (data: any): EmailTemplate {
            throw new Error('Function not implemented.');
        },
        review_completed: function (data: any): EmailTemplate {
            throw new Error('Function not implemented.');
        }
    };

    return templates[payload.type](payload.data);
  }
}

interface EmailTemplate {
  subject: string;
  body: string;
}

export const notificationService = new NotificationService(new Pool());
export const sendNotification = (payload: NotificationPayload) => 
  notificationService.sendNotification(payload);


