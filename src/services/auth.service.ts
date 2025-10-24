import { backendApi } from './backend-api.service';
import { API_CONFIG } from '@/lib/api-config';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User, 
  JWTPayload,
  AuthError 
} from '@/types/auth';

const AUTH_TOKEN_KEY = 'jwt_token'; // Consistente con backend-api.service
const AUTH_USER_KEY = 'whatsapp_auth_user';
const AUTH_EXPIRY_KEY = 'whatsapp_auth_expiry';
const TOKEN_DURATION_HOURS = 12; // Duración del token en horas

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Obtener token almacenado
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  // Obtener usuario almacenado
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Almacenar token y usuario con tiempo de expiración personalizado
  private storeAuth(token: string, user: User): void {
    const expiryTime = Date.now() + (TOKEN_DURATION_HOURS * 60 * 60 * 1000); // 12 horas desde ahora
    
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
  }

  // Limpiar autenticación
  clearAuth(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
  }

  // Decodificar JWT
  private decodeJWT(token: string): JWTPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  // Verificar si el token está expirado (usando nuestra expiración personalizada de 12 horas)
  isTokenExpired(token?: string): boolean {
    try {
      // Verificar expiración personalizada primero (12 horas)
      const customExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);
      if (customExpiry) {
        const expiryTime = parseInt(customExpiry);
        const now = Date.now();
        const isCustomExpired = now >= expiryTime;
        
        if (isCustomExpired) {
          return true;
        }
      }

      // Verificar expiración del JWT también (como respaldo)
      const currentToken = token || this.getStoredToken();
      if (!currentToken) return true;

      const payload = this.decodeJWT(currentToken);
      if (!payload) return true;
      
      const now = Date.now();
      const tokenExpiration = payload.exp * 1000;
      const isJWTExpired = now >= tokenExpiration;
      
      return isJWTExpired;
    } catch (error) {
      console.error('🔐 AuthService: Error verificando expiración del token', error);
      return true;
    }
  }

  // Login
  async login(credentials: LoginRequest): Promise<{ token: string; user: User }> {
    try {
      const loginResponse = await backendApi.login(credentials);

      // Decodificar el JWT para obtener la información del usuario
      const payload = this.decodeJWT(loginResponse.token);
      if (!payload) {
        throw new Error('Token JWT inválido recibido del servidor');
      }

      // Crear objeto User desde el payload JWT
      const user: User = {
        id: 0, // Se puede obtener del backend si es necesario
        username: payload.sub || payload.username || '', // Tu backend usa 'sub' para el email/username
        role: payload.role?.replace('ROLE_', '') as 'USER' | 'ADMIN' | 'SUPERADMIN', // Remover prefijo ROLE_
        empresaId: payload.empresaId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Almacenar en localStorage
      this.storeAuth(loginResponse.token, user);

      return { token: loginResponse.token, user };
    } catch (error) {
      console.error('🔐 AuthService: Error en login', error);
      
      // Verificar si es un error de red
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const backendUrl = API_CONFIG.BACKEND_API_URL || 'http://localhost:8081';
        const isLocal = backendUrl.includes('localhost');
        
        if (isLocal) {
          throw new Error(`No se puede conectar con el servidor local. Verifica que el backend esté ejecutándose en ${backendUrl}`);
        } else {
          throw new Error(`No se puede conectar con el servidor. Verifica la URL del backend: ${backendUrl}`);
        }
      }
      
      const authError: AuthError = {
        code: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Error en el inicio de sesión'
      };
      
      throw authError;
    }
  }

  // Register
  async register(data: RegisterRequest): Promise<User> {
    try {
      const backendUrl = API_CONFIG.BACKEND_API_URL || 'http://localhost:8081';
      // Usar backendApi si está disponible
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en el registro');
      }

      const user: User = await response.json();
      return user;
    } catch (error) {
      console.error('Register error:', error);
      throw error instanceof Error ? error : new Error('Error de conexión');
    }
  }

  // Logout
  logout(): void {
    this.clearAuth();
  }

  // Verificar autenticación
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;
    
    // Verificar si el token está expirado (incluyendo nuestro límite de 12 horas)
    if (this.isTokenExpired(token)) {
      this.clearAuth();
      return false;
    }
    
    return true;
  }

  // Obtener header de autorización
  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = this.getStoredToken();
    if (!token || this.isTokenExpired(token)) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }

  // Realizar request autenticado
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si el token expiró, limpiar autenticación
    if (response.status === 401) {
      this.clearAuth();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    return response;
  }

  // Obtener permisos del usuario
  getUserPermissions(role: string): string[] {
    const permissions = {
      USER: ['READ_CONVERSATIONS', 'READ_LEADS'],
      ADMIN: ['READ_CONVERSATIONS', 'WRITE_CONVERSATIONS', 'READ_LEADS', 'WRITE_LEADS', 'READ_REPORTS', 'ADMIN_PANEL'],
      SUPERADMIN: ['READ_USERS', 'WRITE_USERS', 'READ_CONVERSATIONS', 'WRITE_CONVERSATIONS', 'READ_LEADS', 'WRITE_LEADS', 'READ_REPORTS', 'WRITE_REPORTS', 'ADMIN_PANEL', 'SUPERADMIN_PANEL']
    };
    return permissions[role as keyof typeof permissions] || [];
  }

  // Verificar si el usuario tiene un permiso específico
  hasPermission(permission: string, userRole?: string): boolean {
    const user = this.getStoredUser();
    const role = userRole || user?.role;
    if (!role) return false;
    
    const permissions = this.getUserPermissions(role);
    return permissions.includes(permission);
  }
}

// Exportar instancia singleton
export const authService = AuthService.getInstance();