export interface UserPayload {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  }
  
  export type UserRole = 'citizen' | 'staff' | 'admin';
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  }