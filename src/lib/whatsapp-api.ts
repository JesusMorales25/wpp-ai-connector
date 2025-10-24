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
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
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