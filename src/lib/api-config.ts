// Configuración de API URLs - PRODUCCIÓN
// Las URLs se configuran automáticamente desde variables de entorno

// Variables de entorno con fallbacks para desarrollo
const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001';
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';
const AI_BOT_URL = import.meta.env.VITE_AI_BOT_URL || 'http://localhost:8081/api/chat/send';
const BOT_API_KEY = import.meta.env.VITE_BOT_API_KEY || '';
const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '10000');
const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL || '5000');

// Solo en desarrollo - Debug info
if (import.meta.env.DEV) {
  console.log('🔧 API Config (DEV):', {
    mode: import.meta.env.MODE,
    hasBackendUrl: !!BACKEND_API_URL,
    hasWhatsappUrl: !!WHATSAPP_API_URL,
    hasApiKey: !!BOT_API_KEY
  });
}

export const API_CONFIG = {
  // Backend WhatsApp Bot
  WHATSAPP_API_URL,
  
  // Backend principal
  BACKEND_API_URL,
  
  // Backend IA para chat
  AI_BOT_URL,
  
  // X-API-KEY para el bot
  BOT_API_KEY,
  
  // Timeout para requests
  REQUEST_TIMEOUT,
  
  // Intervalo de polling para estado
  POLLING_INTERVAL
};

// Debug de la configuración final
console.log('🚀 Final API Config:', API_CONFIG);

// Función helper para construir URLs de la API de WhatsApp
export const getWhatsAppApiUrl = (endpoint: string) => {
  return `${API_CONFIG.WHATSAPP_API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// Función helper para requests con timeout
export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_CONFIG.REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};