import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN' | 'SUPERADMIN';
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (!(requiredRole === 'ADMIN' && user?.role === 'SUPERADMIN')) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-destructive mb-2">Acceso Denegado</h2>
              <p className="text-muted-foreground">No tienes permisos suficientes.</p>
            </div>
          </div>
        </div>
      );
    }
  }

  if (requiredPermission && !authService.hasPermission(requiredPermission, user?.role)) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Permisos Insuficientes</h2>
            <p className="text-muted-foreground">No tienes el permiso necesario.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;