// Configuración de API URLs según el entorno
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_CONFIG = {
  // Backend WhatsApp (Railway en producción, localhost en desarrollo)
  WHATSAPP_API_URL: isDevelopment 
    ? 'http://localhost:3001'
    : 'https://wpp-ai-connector-backend-production.up.railway.app', // Cambia por tu URL de Railway
  
  // Backend IA (siempre el mismo)
  AI_BOT_URL: 'https://ianeg-bot-backend-up.onrender.com/api/chat/send',
  
  // Timeout para requests
  REQUEST_TIMEOUT: 10000,
  
  // Intervalo de polling para estado
  POLLING_INTERVAL: 5000
};

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