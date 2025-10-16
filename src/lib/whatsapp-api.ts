const API_BASE_URL = 'http://localhost:3001/api/whatsapp';

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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    return this.request<ApiResponse>('/status');
  }

  static async initialize() {
    return this.request<ApiResponse>('/initialize', {
      method: 'POST',
    });
  }

  static async disconnect() {
    return this.request<ApiResponse>('/disconnect', {
      method: 'POST',
    });
  }

  static async clearSession() {
    return this.request<ApiResponse>('/clear-session', {
      method: 'POST',
    });
  }

  static async sendMessage(numero: string, mensaje: string) {
    return this.request<SendMessageResponse>('/send', {
      method: 'POST',
      body: JSON.stringify({ numero, mensaje }),
    });
  }

  static async getClientInfo() {
    return this.request<ApiResponse>('/info');
  }
}