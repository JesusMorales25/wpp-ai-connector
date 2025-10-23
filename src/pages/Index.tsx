import { useState } from "react";
import QRConnection from "@/components/QRConnection";
import { MessageCircle, Sparkles, Phone, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
              <Phone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Conexión WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Autentica tu WhatsApp para activar el sistema
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Grid principal con QR y estado */}
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Sección de conexión QR */}
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <QRConnection onConnectionChange={setIsConnected} />
            </div>

            {/* Estado de la conexión */}
            <div className="animate-in fade-in slide-in-from-right duration-500 delay-200">
              {isConnected ? (
                <Card className="p-6 shadow-elegant border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Estado de la Conexión
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">WhatsApp Conectado</span>
                      </div>
                      <p className="text-sm text-green-600">
                        Tu WhatsApp está autenticado y listo para usar
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium">Sistema Activo</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        El bot puede recibir y enviar mensajes
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-purple-700 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">IA Disponible</span>
                      </div>
                      <p className="text-sm text-purple-600">
                        Tu bot de IA está listo para responder
                      </p>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">Próximos pasos:</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="text-xs font-medium text-primary">1. Configurar Bot</p>
                          <p className="text-xs text-muted-foreground">Ve a Mensajería</p>
                        </div>
                        <div className="flex-1 text-center p-3 bg-secondary/50 rounded-lg border">
                          <p className="text-xs font-medium">2. Ver Estadísticas</p>
                          <p className="text-xs text-muted-foreground">Ve a Reportes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 shadow-elegant border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Esperando Conexión
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Escanea el código QR para conectar
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-amber-800">
                        Abre WhatsApp en tu teléfono
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-150"></div>
                      <span className="text-sm text-amber-800">
                        Ve a "Dispositivos vinculados"
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-300"></div>
                      <span className="text-sm text-amber-800">
                        Escanea el código QR de la izquierda
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
