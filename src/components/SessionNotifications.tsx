import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSessionTime } from '@/hooks/use-session-time';
import { toast } from 'sonner';
import { AlertTriangle, Clock } from 'lucide-react';

/**
 * Componente que maneja las notificaciones de expiración de sesión
 */
export const SessionNotifications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { timeRemaining, isExpiringSoon } = useSessionTime();
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !timeRemaining) return;

    // Convertir timeRemaining a minutos para las notificaciones
    const parseTime = (timeStr: string): number => {
      if (timeStr === 'Expirado') return 0;
      
      const hourMatch = timeStr.match(/(\d+)h/);
      const minuteMatch = timeStr.match(/(\d+)m/);
      
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      
      return hours * 60 + minutes;
    };

    const totalMinutes = parseTime(timeRemaining);

    // Notificación cuando quedan 30 minutos
    if (totalMinutes <= 30 && totalMinutes > 5 && !hasShownWarning) {
      toast.warning('⏰ Tu sesión expira pronto', {
        description: `Quedan ${timeRemaining} antes de que tu sesión expire automáticamente.`,
        duration: 8000,
        icon: <Clock className="w-4 h-4" />,
      });
      setHasShownWarning(true);
    }

    // Notificación final cuando quedan 5 minutos
    if (totalMinutes <= 5 && totalMinutes > 0 && !hasShownFinalWarning) {
      toast.error('🚨 Sesión expirando', {
        description: `Solo quedan ${timeRemaining}. Guarda tu trabajo y vuelve a iniciar sesión.`,
        duration: 10000,
        icon: <AlertTriangle className="w-4 h-4" />,
      });
      setHasShownFinalWarning(true);
    }

    // Reset de flags cuando la sesión se renueva (nuevo login)
    if (totalMinutes > 30) {
      setHasShownWarning(false);
      setHasShownFinalWarning(false);
    }

  }, [isAuthenticated, timeRemaining, hasShownWarning, hasShownFinalWarning]);

  return null; // Este componente no renderiza nada visible
};

export default SessionNotifications;