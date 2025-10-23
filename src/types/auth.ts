// Tipos para autenticación y usuarios
export interface User {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  empresaId: string;
}

// Contexto de autenticación
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
}

// Estado de la aplicación
export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Errores de autenticación
export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

// JWT Payload - Actualizado para el backend real
export interface JWTPayload {
  sub: string; // Email/username del usuario (subject)
  username?: string; // Campo opcional para compatibilidad
  role: string; // Rol con prefijo ROLE_ (ej: ROLE_SUPERADMIN)
  empresaId: string; // ID de la empresa
  exp: number; // Timestamp de expiración
  iat: number; // Timestamp de creación
}

// Permisos por rol
export type Permission = 
  | 'READ_USERS' 
  | 'WRITE_USERS' 
  | 'READ_REPORTS' 
  | 'WRITE_REPORTS' 
  | 'READ_CONVERSATIONS' 
  | 'WRITE_CONVERSATIONS'
  | 'READ_LEADS'
  | 'WRITE_LEADS'
  | 'ADMIN_PANEL'
  | 'SUPERADMIN_PANEL';

export interface RolePermissions {
  USER: Permission[];
  ADMIN: Permission[];
  SUPERADMIN: Permission[];
}