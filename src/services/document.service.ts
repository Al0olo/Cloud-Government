import { Pool } from 'pg';
import { StorageService } from './storage.service';
import { Document, UploadDocumentDTO, VerifyDocumentDTO } from '../types/document.types';
import { ApplicationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class DocumentService {
  constructor(
    private readonly pool: Pool,
    private readonly storageService: StorageService
  ) {}

  public async uploadDocument(
    applicationId: string,
    data: UploadDocumentDTO,
    userId: string
  ): Promise<Document> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify application exists and user has access
      const applicationResult = await client.query(
        'SELECT user_id FROM applications WHERE id = $1',
        [applicationId]
      );

      if (!applicationResult.rows.length) {
        throw new ApplicationError('Application not found', 404);
      }

      if (applicationResult.rows[0].user_id !== userId) {
        throw new ApplicationError('Unauthorized access', 403);
      }

      // Upload file to storage
      const uploadResult = await this.storageService.uploadToS3(data.file);

      // Create document record
      const documentResult = await client.query(
        `INSERT INTO documents (
          application_id,
          type,
          path,
          status,
          metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          applicationId,
          data.type,
          uploadResult.Location,
          'pending',
          JSON.stringify({
            originalName: data.file.originalname,
            mimeType: data.file.mimetype,
            size: data.file.size,
            ...data.metadata
          })
        ]
      );

      await client.query('COMMIT');
      return this.mapDocumentFromDb(documentResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error uploading document', { error, applicationId });
      throw error;
    } finally {
      client.release();
    }
  }

  public async getDocument(id: string, userId: string): Promise<Document> {
    try {
      const result = await this.pool.query(
        `SELECT d.* 
         FROM documents d
         JOIN applications a ON d.application_id = a.id
         WHERE d.id = $1 AND a.user_id = $2`,
        [id, userId]
      );

      if (!result.rows.length) {
        throw new ApplicationError('Document not found', 404);
      }

      return this.mapDocumentFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting document', { error, documentId: id });
      throw error;
    }
  }

  public async verifyDocument(
    id: string,
    data: VerifyDocumentDTO,
    verifierId: string
  ): Promise<Document> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE documents
         SET status = $1,
             verified_at = NOW(),
             verified_by = $2,
             metadata = jsonb_set(
               COALESCE(metadata, '{}')::jsonb,
               '{verificationNotes}',
               $3::jsonb
             )
         WHERE id = $4
         RETURNING *`,
        [data.status, verifierId, JSON.stringify(data.notes), id]
      );

      if (!result.rows.length) {
        throw new ApplicationError('Document not found', 404);
      }

      await client.query('COMMIT');
      return this.mapDocumentFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error verifying document', { error, documentId: id });
      throw error;
    } finally {
      client.release();
    }
  }

  public async deleteDocument(id: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Check document exists and user has access
      const result = await client.query(
        `SELECT d.*, d.path as storage_path
         FROM documents d
         JOIN applications a ON d.application_id = a.id
         WHERE d.id = $1 AND a.user_id = $2`,
        [id, userId]
      );

      if (!result.rows.length) {
        throw new ApplicationError('Document not found', 404);
      }

      // Delete from storage
      const storageKey = this.storageService.getKeyFromUrl(result.rows[0].storage_path);
      await this.storageService.deleteFromS3(storageKey);

      // Delete from database
      await client.query('DELETE FROM documents WHERE id = $1', [id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error deleting document', { error, documentId: id });
      throw error;
    } finally {
      client.release();
    }
  }

  private mapDocumentFromDb(dbDocument: any): Document {
    return {
      id: dbDocument.id,
      applicationId: dbDocument.application_id,
      type: dbDocument.type,
      path: dbDocument.path,
      status: dbDocument.status,
      createdAt: dbDocument.created_at,
      updatedAt: dbDocument.updated_at,
      verifiedAt: dbDocument.verified_at,
      verifiedBy: dbDocument.verified_by,
      metadata: dbDocument.metadata
    };
  }}