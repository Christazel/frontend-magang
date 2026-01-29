// ============================================
// Global TypeScript Types & Interfaces
// ============================================

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = "admin",
  PESERTA = "peserta",
}

/**
 * User model - represents authenticated user
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Auth context type
 */
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Login request/response types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Menu item configuration
 */
export interface MenuItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}