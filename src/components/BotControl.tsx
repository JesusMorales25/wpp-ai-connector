import { useEffect, useState } from "react";
import { Bot, Activity, MessageSquare, AlertTriangle, BarChart3, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { API_CONFIG } from "@/lib/api-config";

interface BotStats {
  messagesReceived: number;
  messagesSentToAI: number;
  errors: number;
  startTime: string;
  uptime: string;
  messagesPerHour: number;
}

interface BotControlProps {
  isConnected: boolean;
}

const BotControl = ({ isConnected }: BotControlProps) => {
  const [autoBotEnabled, setAutoBotEnabled] = useState(true);
  const [stats, setStats] = useState<BotStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener estadísticas
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setAutoBotEnabled(data.autoBotEnabled);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Alternar bot automático
  const toggleAutoBot = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/toggle-autobot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutoBotEnabled(data.autoBotEnabled);
        toast.success(data.message);
      } else {
        throw new Error('Error al cambiar estado del bot');
      }
    } catch (error) {
      toast.error('Error al cambiar estado del bot automático');
      console.error('Error toggling autobot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reiniciar estadísticas
  const resetStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/reset-stats`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Estadísticas reiniciadas');
        fetchStats();
      } else {
        throw new Error('Error al reiniciar estadísticas');
      }
    } catch (error) {
      toast.error('Error al reiniciar estadísticas');
      console.error('Error resetting stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar estadísticas cada 5 segundos
  useEffect(() => {
    if (isConnected) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <Card className="p-6 shadow-elegant">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Control del Bot Automático
          </h2>
        </div>

        {/* Estado del bot */}
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${autoBotEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div>
              <p className="font-semibold">Bot Automático</p>
              <p className="text-sm text-muted-foreground">
                {autoBotEnabled ? 'Respondiendo mensajes automáticamente' : 'Pausado'}
              </p>
            </div>
          </div>
          <Switch
            checked={autoBotEnabled}
            onCheckedChange={toggleAutoBot}
            disabled={!isConnected || isLoading}
          />
        </div>

        {/* Descripción del funcionamiento */}
        {isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Cómo funciona?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los mensajes que recibas en WhatsApp se envían automáticamente a tu bot IA</li>
              <li>• Tu bot IA procesa el mensaje y responde automáticamente</li>
              <li>• No necesitas hacer nada, el sistema trabaja en segundo plano</li>
            </ul>
          </div>
        )}

        {/* Estadísticas */}
        {stats && isConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Estadísticas
              </h3>
              <Button
                onClick={resetStats}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Mensajes recibidos</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{stats.messagesReceived}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Bot className="w-4 h-4" />
                  <span className="text-sm font-medium">Enviados a IA</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{stats.messagesSentToAI}</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-purple-700">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">Tiempo activo</span>
                </div>
                <p className="text-lg font-bold text-purple-900">{stats.uptime}</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Errores</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{stats.errors}</p>
              </div>
            </div>

            {stats.messagesPerHour > 0 && (
              <div className="text-sm text-muted-foreground text-center">
                Promedio: {stats.messagesPerHour} mensajes por hora
              </div>
            )}
          </div>
        )}

        {/* Estado sin conexión */}
        {!isConnected && (
          <div className="text-center text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Conecta tu WhatsApp para activar el bot automático</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BotControl;