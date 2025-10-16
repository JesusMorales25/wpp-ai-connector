import { useState, useEffect, useCallback } from 'react';

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

const API_BASE_URL = 'http://localhost:3001/api/whatsapp';

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
      const response = await fetch(`${API_BASE_URL}/status`, {
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
          const infoResponse = await fetch(`${API_BASE_URL}/info`, {
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
      const response = await fetch(`${API_BASE_URL}/initialize`, {
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
      const interval = setInterval(checkStatus, 2000);
      
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
      const response = await fetch(`${API_BASE_URL}/disconnect`, {
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
      const response = await fetch(`${API_BASE_URL}/clear-session`, {
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
      const response = await fetch(`${API_BASE_URL}/send`, {
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

  // Verificar estado inicial y establecer polling
  useEffect(() => {
    checkStatus();
    
    // Verificar estado cada 5 segundos cuando esté desconectado
    const interval = setInterval(() => {
      if (status.status === 'disconnected' || status.status === 'qr_received') {
        checkStatus();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [checkStatus, status.status]);

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