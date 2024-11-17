export interface Document {
    id: string;
    applicationId: string;
    type: DocumentType;
    path: string;
    status: DocumentStatus;
    createdAt: Date;
    updatedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: string;
    metadata?: DocumentMetadata;
  }
  
  export type DocumentType = 
    | 'construction_plan'
    | 'site_plan'
    | 'property_deed'
    | 'identification'
    | 'contractor_license'
    | 'insurance_certificate'
    | 'other';
  
  export type DocumentStatus = 'pending' | 'verified' | 'rejected';
  
  export interface DocumentMetadata {
    originalName: string;
    mimeType: string;
    size: number;
    pages?: number;
    hash?: string;
    verificationNotes?: string;
  }
  
  export interface UploadDocumentDTO {
    type: DocumentType;
    file: Express.Multer.File;
    metadata?: Partial<DocumentMetadata>;
  }
  
  export interface VerifyDocumentDTO {
    status: 'verified' | 'rejected';
    notes?: string;
  }