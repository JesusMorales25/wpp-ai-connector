import { useEffect, useState } from "react";
import { Bot, Activity, MessageSquare, AlertTriangle, BarChart3, RotateCcw, Shield, Users, Clock, FileX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { API_CONFIG } from "@/lib/api-config";

interface BotStats {
  messagesReceived: number;
  messagesSentToAI: number;
  errors: number;
  spamBlocked: number;
  rateLimited: number;
  mediaIgnored: number;
  systemIgnored: number;
  uniqueUsers: number;
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Estadísticas principales */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-medium">Recibidos</span>
                </div>
                <p className="text-xl font-bold text-green-900">{stats.messagesReceived}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-medium">A IA</span>
                </div>
                <p className="text-xl font-bold text-blue-900">{stats.messagesSentToAI}</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Usuarios</span>
                </div>
                <p className="text-xl font-bold text-purple-900">{stats.uniqueUsers}</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Errores</span>
                </div>
                <p className="text-xl font-bold text-orange-900">{stats.errors}</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-medium">Spam</span>
                </div>
                <p className="text-xl font-bold text-red-900">{stats.spamBlocked}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Rate Limit</span>
                </div>
                <p className="text-xl font-bold text-yellow-900">{stats.rateLimited}</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <FileX className="w-4 h-4" />
                  <span className="text-xs font-medium">Media</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{stats.mediaIgnored}</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-indigo-700 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium">Uptime</span>
                </div>
                <p className="text-sm font-bold text-indigo-900">{stats.uptime}</p>
              </div>
            </div>

            {/* Métricas de rendimiento */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-sm text-emerald-700 font-medium">Eficiencia</p>
                <p className="text-lg font-bold text-emerald-900">
                  {stats.spamBlocked > 0 ? 
                    Math.round((stats.spamBlocked / (stats.spamBlocked + stats.messagesReceived)) * 100) : 0}%
                </p>
                <p className="text-xs text-emerald-600">SPAM filtrado</p>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-center">
                <p className="text-sm text-cyan-700 font-medium">Ahorro</p>
                <p className="text-lg font-bold text-cyan-900">{stats.spamBlocked}</p>
                <p className="text-xs text-cyan-600">Requests evitados</p>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-center">
                <p className="text-sm text-pink-700 font-medium">Sistema</p>
                <p className="text-lg font-bold text-pink-900">{stats.systemIgnored}</p>
                <p className="text-xs text-pink-600">Msgs de sistema</p>
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