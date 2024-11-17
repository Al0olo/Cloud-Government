export interface ApplicationCreateDTO {
    type: ApplicationType;
    data: ApplicationData;
    documents?: DocumentDTO[];
  }
  
  export interface ApplicationUpdateDTO {
    data?: ApplicationData;
    status?: ApplicationStatus;
    documents?: DocumentDTO[];
  }
  
  export interface DocumentDTO {
    type: DocumentType;
    file: Express.Multer.File;
  }
  
  export type ApplicationType = 
    | 'building_permit'
    | 'business_license'
    | 'planning_permit'
    | 'zoning_request';
  
  export type ApplicationStatus = 
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'information_required'
    | 'approved'
    | 'rejected';
  
  export type DocumentType = 
    | 'construction_plan'
    | 'site_plan'
    | 'property_deed'
    | 'identification'
    | 'other';
  
  export interface ApplicationData {
    projectType?: string;
    projectDescription?: string;
    estimatedCost?: number;
    startDate?: string;
    propertyAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    parcelNumber?: string;
    zoneType?: string;
    applicant?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      isOwner: boolean;
    };
    contractor?: {
      companyName: string;
      licenseNumber: string;
      contactName: string;
      email: string;
      phone: string;
    };
    construction?: {
      squareFootage: number;
      stories: number;
      occupancyType: string;
      constructionType: string;
    };
    [key: string]: any;
  }