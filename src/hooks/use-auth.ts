import { useContext } from 'react';
import { AuthContextType } from '@/types/auth';
import { AuthContext } from '@/contexts/auth.context';

// Hook para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};