// Servicio para WhatsApp Bot con X-API-KEY
import { API_CONFIG } from '@/lib/api-config';

export interface BotMessage {
  to: string;
  message: string;
  type: 'text' | 'image' | 'document';
  mediaUrl?: string;
}

export interface BotResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  respuesta?: string;
}

class WhatsAppBotService {
  private static instance: WhatsAppBotService;

  static getInstance(): WhatsAppBotService {
    if (!WhatsAppBotService.instance) {
      WhatsAppBotService.instance = new WhatsAppBotService();
    }
    return WhatsAppBotService.instance;
  }

  // Enviar mensaje individual
  async sendMessage(messageData: BotMessage): Promise<BotResponse> {
    try {
      console.log('🤖 WhatsApp Bot: Enviando mensaje', { to: messageData.to, type: messageData.type });
      
      const response = await fetch(`${API_CONFIG.BACKEND_API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': API_CONFIG.BOT_API_KEY
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 WhatsApp Bot: Error en respuesta', { status: response.status, error: errorText });
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data: BotResponse = await response.json();
      console.log('🤖 WhatsApp Bot: Mensaje enviado exitosamente', data);
      
      return {
        success: true,
        ...data
      };

    } catch (error) {
      console.error('🤖 WhatsApp Bot: Error enviando mensaje', error);
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('No se pudo conectar con el bot de WhatsApp. Verifica la conexión.');
        }
        throw error;
      }
      
      throw new Error('Error inesperado enviando mensaje');
    }
  }

  // Enviar mensaje masivo
  async sendBulkMessages(messages: BotMessage[]): Promise<BotResponse[]> {
    const results: BotResponse[] = [];
    
    for (const message of messages) {
      try {
        const result = await this.sendMessage(message);
        results.push(result);
        
        // Esperar un poco entre mensajes para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    return results;
  }

  // Obtener estado del bot
  async getBotStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_API_URL}/api/bot/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': API_CONFIG.BOT_API_KEY
        }
      });

      if (!response.ok) {
        return { connected: false, error: `Error ${response.status}` };
      }

      const data = await response.json();
      return { connected: true, ...data };
      
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  }
}

export const whatsAppBotService = WhatsAppBotService.getInstance();