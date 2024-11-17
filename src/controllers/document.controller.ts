import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';
import { ApplicationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class DocumentController {
  constructor(private readonly documentService: DocumentService) {
    this.uploadDocument = this.uploadDocument.bind(this);
    this.getDocument = this.getDocument.bind(this);
    this.verifyDocument = this.verifyDocument.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
  }

  public uploadDocument: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const file = req.file;

      if (!file) {
        throw new ApplicationError('No file uploaded', 400);
      }

      const document = await this.documentService.uploadDocument(
        applicationId,
        {
          type: req.body.type,
          file,
          metadata: req.body.metadata
        },
        req.user!.id
      );

      res.status(201).json(document);
    } catch (error) {
      logger.error('Error uploading document', { error });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to upload document' });
    }
  };

  public getDocument: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const document = await this.documentService.getDocument(
        req.params.id,
        req.user!.id
      );
      res.json(document);
    } catch (error) {
      logger.error('Error getting document', { error });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to get document' });
    }
  };

  public verifyDocument: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const document = await this.documentService.verifyDocument(
        req.params.id,
        req.body,
        req.user!.id
      );
      res.json(document);
    } catch (error) {
      logger.error('Error verifying document', { error });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to verify document' });
    }
  };

  public deleteDocument: (req: Request, res: Response) => Promise<void> = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      await this.documentService.deleteDocument(
        req.params.id,
        req.user!.id
      );
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting document', { error });
      if (error instanceof ApplicationError) {
        res.status(error.statusCode).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to delete document' });
    }
  };
}