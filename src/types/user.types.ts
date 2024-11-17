export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    notificationPreferences: NotificationPreferences;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
  }
  
  export type UserRole = 'citizen' | 'staff' | 'admin';
  
  export type UserStatus = 'active' | 'inactive' | 'suspended';
  
  export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    applicationUpdates: boolean;
    documentRequests: boolean;
    statusChanges: boolean;
    generalAnnouncements: boolean;
  }
  
  export interface UpdateProfileDTO {
    firstName?: string;
    lastName?: string;
    phone?: string;
    notificationPreferences?: Partial<NotificationPreferences>;
  }
  
  export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }