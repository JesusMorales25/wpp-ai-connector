import { useState } from "react";
import QRConnection from "@/components/QRConnection";
import ChatInterface from "@/components/ChatInterface";
import BotControl from "@/components/BotControl";
import { MessageCircle, Sparkles } from "lucide-react";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                WhatsApp AI Bot Connector
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Conexión real de WhatsApp + Bot de IA
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <QRConnection onConnectionChange={setIsConnected} />
          </div>
          <div className="animate-in fade-in slide-in-from-right duration-500 delay-150">
            <BotControl isConnected={isConnected} />
          </div>
        </div>

        {/* Panel de envío manual (opcional) */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom duration-500 delay-300">
            <ChatInterface isConnected={isConnected} />
          </div>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-card rounded-xl p-6 shadow-elegant border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Bot Automático de WhatsApp + IA
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>
                  <strong>Conecta:</strong> Escanea el código QR con tu WhatsApp para autenticar
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>
                  <strong>Automático:</strong> Cada mensaje que recibas se envía automáticamente a tu bot IA
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>
                  <strong>IA Responde:</strong> Tu bot OpenAI procesa el mensaje y responde automáticamente
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>
                  <strong>24/7:</strong> Funciona en segundo plano, respondiendo mensajes automáticamente
                </span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                🤖 <strong>¡Totalmente automático!</strong> Una vez conectado, no necesitas hacer nada más. 
                El bot responderá a todos los mensajes que recibas usando tu IA personalizada.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
