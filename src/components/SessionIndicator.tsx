import React from 'react';
import { Clock, AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSessionTime } from '@/hooks/use-session-time';
import { cn } from '@/lib/utils';

/**
 * Componente que muestra el tiempo restante de la sesión
 */
export const SessionIndicator: React.FC = () => {
  const { timeRemaining, isExpiringSoon } = useSessionTime();

  if (!timeRemaining) return null;

  const isExpired = timeRemaining === 'Expirado';

  return (
    <Badge 
      variant={isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'outline'}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
        isExpired && "bg-red-100 text-red-800 border-red-200",
        isExpiringSoon && !isExpired && "bg-yellow-100 text-yellow-800 border-yellow-200",
        !isExpiringSoon && !isExpired && "bg-green-100 text-green-800 border-green-200"
      )}
    >
      {isExpired ? (
        <AlertTriangle className="w-3 h-3" />
      ) : isExpiringSoon ? (
        <Clock className="w-3 h-3" />
      ) : (
        <Shield className="w-3 h-3" />
      )}
      
      <span>
        {isExpired ? 'Sesión expirada' : `Sesión: ${timeRemaining}`}
      </span>
    </Badge>
  );
};