import { createContext } from 'react';
import { AuthContextType } from '@/types/auth';

// Crear contexto de autenticación
export const AuthContext = createContext<AuthContextType | undefined>(undefined);