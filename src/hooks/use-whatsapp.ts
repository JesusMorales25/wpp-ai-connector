import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/lib/api-config';

export interface WhatsAppStatus {
  status: 'disconnected' | 'qr_received' | 'authenticating' | 'connected';
  isReady: boolean;
  qrCode: string | null;
  hasSession: boolean;
}

export interface WhatsAppInfo {
  wid: string;
  pushname: string;
  phone: string;
}

const API_BASE_URL = API_CONFIG.WHATSAPP_API_URL;

export const useWhatsApp = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isReady: false,
    qrCode: null,
    hasSession: false
  });
  
  const [clientInfo, setClientInfo] = useState<WhatsAppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el estado actual
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Agregar timeout para evitar esperas largas
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setError(null);
      
      // Si está conectado, obtener información del cliente
      if (data.isReady && data.status === 'connected') {
        try {
          const infoResponse = await fetch(`${API_BASE_URL}/api/whatsapp/info`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
          });
          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            if (infoData.success) {
              setClientInfo(infoData.info);
            }
          }
        } catch (infoErr) {
          console.error('Error getting client info:', infoErr);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Timeout: El servidor no responde');
        } else if (err.message.includes('fetch')) {
          setError('No se puede conectar al servidor. ¿Está ejecutándose el backend?');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error de conexión');
      }
      console.error('Error checking WhatsApp status:', err);
    }
  }, []);

  // Función para inicializar la conexión
  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize');
      }
      
      // Comenzar a verificar el estado periódicamente
  const interval = setInterval(checkStatus, 15000);
      
      // Limpiar interval después de 60 segundos o cuando se conecte
      setTimeout(() => clearInterval(interval), 60000);
      
      return () => clearInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error initializing WhatsApp');
      console.error('Error initializing WhatsApp:', err);
    } finally {
      setIsLoading(false);
    }
  }, [checkStatus]);

  // Función para desconectar
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_BOT_API_KEY;
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to disconnect');
      }
      
      setStatus({
        status: 'disconnected',
        isReady: false,
        qrCode: null,
        hasSession: false
      });
      setClientInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error disconnecting WhatsApp');
      console.error('Error disconnecting WhatsApp:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para limpiar sesión
  const clearSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_BOT_API_KEY;
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/clear-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to clear session');
      }
      
      setStatus({
        status: 'disconnected',
        isReady: false,
        qrCode: null,
        hasSession: false
      });
      setClientInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing session');
      console.error('Error clearing session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para enviar mensaje
  const sendMessage = useCallback(async (numero: string, mensaje: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numero, mensaje }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error sending message');
    }
  }, []);

  // Verificar estado inicial y establecer polling continuo
  useEffect(() => {
    // Primera comprobación inmediata
    checkStatus();

    // Polling continuo cada 2s para mantener la UI sincronizada con el backend
    const interval = setInterval(() => {
      checkStatus();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    // Estado
    status,
    clientInfo,
    isLoading,
    error,
    
    // Funciones
    initialize,
    disconnect,
    clearSession,
    sendMessage,
    checkStatus,
    
    // Estados derivados
    isConnected: status.isReady && status.status === 'connected',
    needsQR: status.status === 'qr_received' && status.qrCode !== null,
    hasSession: status.hasSession
  };
};