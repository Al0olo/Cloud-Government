import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';
import path from 'path';
import { ApplicationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface UploadResult {
  Location: string;
  Key: string;
  Bucket: string;
}

export class StorageService {
  private s3: AWS.S3;
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
    this.region = process.env.AWS_REGION!;
    
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: this.region
    });
  }

  async uploadToS3(file: Express.Multer.File): Promise<UploadResult> {
    try {
      const fileExtension = path.extname(file.originalname);
      const key = `documents/${uuidv4()}${fileExtension}`;

      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private',
        Metadata: {
          originalname: file.originalname,
          mimetype: file.mimetype
        }
      };

      const result = await this.s3.upload(params).promise();
      
      return {
        Location: result.Location,
        Key: result.Key,
        Bucket: this.bucket
      };
    } catch (error) {
      logger.error('Failed to upload file to S3', { error });
      throw new ApplicationError('Failed to upload file', 500);
    }
  }

  async deleteFromS3(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
    } catch (error) {
      logger.error('Failed to delete file from S3', { error, key });
      throw new ApplicationError('Failed to delete file', 500);
    }
  }

  getSignedUrl(key: string, expiresIn: number = 3600): string {
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn
      });
    } catch (error) {
      logger.error('Failed to generate signed URL', { error, key });
      throw new ApplicationError('Failed to generate file access URL', 500);
    }
  }

  getKeyFromUrl(fileUrl: string): string {
    try {
      // Handle both full URLs and S3 keys
      if (!fileUrl.startsWith('http')) {
        return fileUrl;
      }

      const url = new URL(fileUrl);
      
      // Handle different S3 URL formats
      if (url.hostname.includes('s3.amazonaws.com')) {
        // Format: https://bucket-name.s3.amazonaws.com/key
        const pathParts = url.pathname.split('/');
        return pathParts.slice(1).join('/');
      } else if (url.hostname.endsWith('amazonaws.com')) {
        // Format: https://s3.region.amazonaws.com/bucket-name/key
        const pathParts = url.pathname.split('/');
        return pathParts.slice(2).join('/');
      }

      throw new Error('Invalid S3 URL format');
    } catch (error) {
      logger.error('Failed to parse S3 URL', { error, fileUrl });
      throw new ApplicationError('Invalid file URL', 400);
    }
  }

  isValidS3Url(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname.includes('amazonaws.com') &&
        parsedUrl.pathname.length > 1
      );
    } catch {
      return false;
    }
  }

  generateS3Url(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  // Utility method to validate file types
  validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  // Utility method to validate file size
  validateFileSize(file: Express.Multer.File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  // Get file metadata from S3
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      return await this.s3.headObject(params).promise();
    } catch (error) {
      logger.error('Failed to get file metadata', { error, key });
      throw new ApplicationError('Failed to get file metadata', 500);
    }
  }

  // Copy file within S3
  async copyFile(sourceKey: string, destinationKey: string): Promise<UploadResult> {
    try {
      const params = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey
      };

      const result = await this.s3.copyObject(params).promise();
      
      return {
        Location: this.generateS3Url(destinationKey),
        Key: destinationKey,
        Bucket: this.bucket
      };
    } catch (error) {
      logger.error('Failed to copy file in S3', { error, sourceKey, destinationKey });
      throw new ApplicationError('Failed to copy file', 500);
    }
  }
}

export const storageService = new StorageService();