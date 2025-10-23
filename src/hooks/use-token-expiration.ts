import { useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

/**
 * Hook para verificar automáticamente la expiración del token
 * y manejar el cierre de sesión automático
 */
export const useTokenExpiration = () => {
  const { logout, isAuthenticated } = useAuth();

  const checkTokenExpiration = useCallback(() => {
    if (isAuthenticated) {
      const token = authService.getStoredToken();
      
      if (!token || authService.isTokenExpired(token)) {
        console.log('🔐 useTokenExpiration: Token expirado, cerrando sesión automáticamente');
        toast.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
          duration: 5000,
        });
        logout();
        return true; // Token expirado
      }
    }
    return false; // Token válido o no autenticado
  }, [isAuthenticated, logout]);

  // Verificar cada 5 minutos si el token sigue siendo válido
  useEffect(() => {
    if (!isAuthenticated) return;

    // Verificación inicial
    checkTokenExpiration();

    // Configurar verificación periódica cada 5 minutos
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenExpiration]);

  // También verificar cuando la pestaña vuelve a estar activa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('🔐 useTokenExpiration: Pestaña activa, verificando token');
        checkTokenExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, checkTokenExpiration]);

  return {
    checkTokenExpiration,
  };
};