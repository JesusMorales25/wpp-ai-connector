import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { User, AuthContextType, LoginRequest, RegisterRequest } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { AuthContext } from '@/contexts/auth.context';
import { toast } from 'sonner';

// Props del provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar autenticación al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getStoredToken();
        const storedUser = authService.getStoredUser();

        if (storedToken && storedUser && authService.isAuthenticated()) {
          setToken(storedToken);
          setUser(storedUser);
          toast.success(`Bienvenido de vuelta, ${storedUser.username}!`);
        } else {
          // Limpiar datos inválidos
          authService.clearAuth();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login
  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const { token: newToken, user: newUser } = await authService.login(credentials);
      
      setToken(newToken);
      setUser(newUser);
      toast.success(`¡Bienvenido, ${newUser.username}!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de autenticación';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = useCallback((): void => {
    authService.logout();
    setToken(null);
    setUser(null);
    toast.info('Sesión cerrada correctamente');
  }, []);

  // Register
  const register = async (data: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast.success('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el registro';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Computed values
  const isAuthenticated = token !== null && user !== null && authService.isAuthenticated();

  // Verificación automática de expiración de token cada 5 minutos
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      const storedToken = authService.getStoredToken();
      
      if (!storedToken || authService.isTokenExpired(storedToken)) {
        toast.warning('Tu sesión ha expirado después de 12 horas. Por favor, inicia sesión nuevamente.', {
          duration: 6000,
        });
        logout();
      }
    };

    // Verificación inicial
    checkTokenExpiration();

    // Verificación cada 5 minutos
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    // Verificar cuando la pestaña vuelve a estar activa
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTokenExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, logout]);

  // Context value
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};