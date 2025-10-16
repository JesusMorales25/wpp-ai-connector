// Configuración de API URLs - HARDCODEADO TEMPORALMENTE
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URLs hardcodeadas para evitar problemas de variables de entorno
const RAILWAY_URL = 'https://wpp-ai-connector-production.up.railway.app';
const AI_BOT_URL = 'https://ianeg-bot-backend-up.onrender.com/api/chat/send';

// Debug info para verificar configuración
console.log('🔧 API Config Debug:', {
  hostname: window.location.hostname,
  isDevelopment,
  RAILWAY_URL,
  AI_BOT_URL
});

export const API_CONFIG = {
  // Backend WhatsApp (Railway en producción, localhost en desarrollo)
  WHATSAPP_API_URL: isDevelopment 
    ? 'http://localhost:3001'
    : RAILWAY_URL,
  
  // Backend IA
  AI_BOT_URL: AI_BOT_URL,
  
  // Timeout para requests
  REQUEST_TIMEOUT: 10000,
  
  // Intervalo de polling para estado
  POLLING_INTERVAL: 5000
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