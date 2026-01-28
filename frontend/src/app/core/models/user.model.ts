// User Role enumeration
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  DRIVER = 'DRIVER',
}

// User model
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  profileImage?: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Authentication response
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

// Registration DTO
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Login DTO
export interface LoginDto {
  email: string;
  password: string;
}
