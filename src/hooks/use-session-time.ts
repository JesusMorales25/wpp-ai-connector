import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

/**
 * Hook para obtener el tiempo restante de la sesión
 */
export const useSessionTime = () => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const expiryStr = localStorage.getItem('whatsapp_auth_expiry');
      if (!expiryStr) {
        setTimeRemaining('');
        return;
      }

      const expiryTime = parseInt(expiryStr);
      const now = Date.now();
      const msRemaining = expiryTime - now;

      if (msRemaining <= 0) {
        setTimeRemaining('Expirado');
        setIsExpiringSoon(true);
        return;
      }

      const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

      // Considerar "expirando pronto" si quedan menos de 30 minutos
      setIsExpiringSoon(msRemaining < 30 * 60 * 1000);

      if (hoursRemaining > 0) {
        setTimeRemaining(`${hoursRemaining}h ${minutesRemaining}m`);
      } else {
        setTimeRemaining(`${minutesRemaining}m`);
      }
    };

    // Actualizar inmediatamente
    updateTimeRemaining();

    // Actualizar cada minuto
    const interval = setInterval(updateTimeRemaining, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    timeRemaining,
    isExpiringSoon,
  };
};