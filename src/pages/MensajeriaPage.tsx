import { useState, useEffect } from "react";
import BotControl from "@/components/BotControl";
import ChatInterface from "@/components/ChatInterface";
import { MessageCircle, Sparkles, Bot, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useWhatsApp } from "@/hooks/use-whatsapp";

const MensajeriaPage = () => {
  const { isConnected } = useWhatsApp();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Centro de Mensajería WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Control del bot automático y envío manual de mensajes
              </p>
            </div>
          </div>

          {/* Estado de conexión */}
          <div className={`p-4 rounded-lg border ${
            isConnected 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-amber-500'
              }`}></div>
              <span className="font-medium">
                {isConnected 
                  ? '✅ WhatsApp conectado y listo para usar' 
                  : '⚠️ WhatsApp no conectado - Ve a "Conexión WhatsApp" para escanear el código QR'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Grid principal con control del bot y envío manual */}
        <div className="grid xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <BotControl isConnected={isConnected} />
          </div>
          <div className="animate-in fade-in slide-in-from-right duration-500 delay-150">
            <ChatInterface isConnected={isConnected} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MensajeriaPage;