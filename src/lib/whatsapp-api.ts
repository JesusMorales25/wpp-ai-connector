import { getWhatsAppApiUrl, fetchWithTimeout } from './api-config';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  messageId: string;
  to: string;
}

export class WhatsAppApiService {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = getWhatsAppApiUrl(endpoint);
      
      // Log solo en desarrollo
      if (import.meta.env.DEV) {
        console.log(`📡 WhatsApp API Request: ${options.method || 'GET'} ${url}`);
      }
      
      // Agregar API Key desde variables de entorno
      const apiKey = import.meta.env.VITE_BOT_API_KEY;
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-Key': apiKey }), // Solo agregar si existe
          ...options.headers,
        },
        ...options,
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`❌ Expected JSON but got: ${contentType}`);
        console.error(`Response preview: ${text.substring(0, 200)}`);
        throw new Error(`El servidor respondió con formato incorrecto (${response.status}). Esperaba JSON pero recibió HTML.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  static async getStatus() {
    return this.request<ApiResponse>('/api/whatsapp/status');
  }

  static async initialize() {
    return this.request<ApiResponse>('/api/whatsapp/initialize', {
      method: 'POST',
    });
  }

  static async disconnect() {
    return this.request<ApiResponse>('/api/whatsapp/disconnect', {
      method: 'POST',
    });
  }

  static async clearSession() {
    return this.request<ApiResponse>('/api/whatsapp/clear-session', {
      method: 'POST',
    });
  }

  static async sendMessage(numero: string, mensaje: string) {
    return this.request<SendMessageResponse>('/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ numero, mensaje }),
    });
  }

  static async getClientInfo() {
    return this.request<ApiResponse>('/api/whatsapp/info');
  }

  static async getStats() {
    return this.request<ApiResponse>('/api/whatsapp/stats');
  }

  static async toggleAutoBot(enabled: boolean) {
    return this.request<ApiResponse>('/api/whatsapp/toggle-autobot', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }
}