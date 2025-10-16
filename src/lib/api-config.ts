// Configuración de API URLs usando variables de entorno
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const railwayUrl = import.meta.env.VITE_RAILWAY_URL || 'wpp-ai-connector-production.up.railway.app';

// Debug info para verificar configuración
console.log('🔧 API Config Debug:', {
  hostname: window.location.hostname,
  isDevelopment,
  railwayUrl,
  hasEnvVar: !!import.meta.env.VITE_RAILWAY_URL
});

export const API_CONFIG = {
  // Backend WhatsApp (Railway en producción, localhost en desarrollo)
  WHATSAPP_API_URL: isDevelopment 
    ? 'http://localhost:3001'
    : `https://${railwayUrl}`,
  
  // Backend IA (configurable por variable de entorno)
  AI_BOT_URL: import.meta.env.VITE_AI_BOT_URL || 'https://ianeg-bot-backend-up.onrender.com/api/chat/send',
  
  // Timeout para requests (configurable)
  REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '10000'),
  
  // Intervalo de polling para estado (configurable)
  POLLING_INTERVAL: parseInt(import.meta.env.VITE_POLLING_INTERVAL || '5000')
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