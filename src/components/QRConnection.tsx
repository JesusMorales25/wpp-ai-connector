import { useEffect, useState } from "react";
import { QrCode, Loader2, CheckCircle2, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import { toast } from "sonner";

interface QRConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

const QRConnection = ({ onConnectionChange }: QRConnectionProps) => {
  const {
    status,
    clientInfo,
    isLoading,
    error,
    initialize,
    disconnect,
    clearSession,
    isConnected,
    needsQR,
    hasSession
  } = useWhatsApp();

  const [qrImageUrl, setQrImageUrl] = useState<string>("");

  // Generar URL del QR code
  useEffect(() => {
    if (status.qrCode) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(status.qrCode)}`;
      setQrImageUrl(qrUrl);
    } else {
      setQrImageUrl("");
    }
  }, [status.qrCode]);

  // Notificar cambios de conexión al componente padre
  useEffect(() => {
    onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  // Mostrar errores como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleInitialize = async () => {
    try {
      await initialize();
      toast.success("Inicializando conexión con WhatsApp...");
    } catch (err) {
      toast.error("Error al inicializar la conexión");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Desconectado de WhatsApp");
    } catch (err) {
      toast.error("Error al desconectar");
    }
  };

  const handleClearSession = async () => {
    try {
      await clearSession();
      toast.success("Sesión limpiada. Genera un nuevo QR.");
    } catch (err) {
      toast.error("Error al limpiar la sesión");
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'disconnected':
        return 'Desconectado';
      case 'qr_received':
        return 'Esperando escaneo del QR';
      case 'authenticating':
        return 'Autenticando...';
      case 'connected':
        return '¡Conectado!';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'text-green-600';
      case 'qr_received':
        return 'text-blue-600';
      case 'authenticating':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-8 shadow-elegant">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <QrCode className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Conexión WhatsApp Web
          </h2>
        </div>

        {/* Estado de conexión */}
        <div className="text-center">
          <p className={`text-lg font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          {clientInfo && (
            <p className="text-sm text-muted-foreground mt-1">
              Conectado como: {clientInfo.pushname} ({clientInfo.phone})
            </p>
          )}
          {hasSession && status.status === 'disconnected' && (
            <p className="text-sm text-blue-600 mt-1">
              Sesión guardada disponible
            </p>
          )}
        </div>

        {/* Área del QR o estado */}
        <div className="relative w-[300px] h-[300px] rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 text-destructive">
              <AlertCircle className="w-12 h-12" />
              <p className="text-sm text-center px-4">Error de conexión</p>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <CheckCircle2 className="w-20 h-20 text-green-600" />
              <p className="text-lg font-semibold text-green-600">¡Conectado!</p>
            </div>
          ) : needsQR && qrImageUrl ? (
            <img
              src={qrImageUrl}
              alt="QR Code para WhatsApp"
              className="w-full h-full object-contain animate-in fade-in duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <QrCode className="w-12 h-12" />
              <p className="text-sm text-center px-4">
                {status.status === 'disconnected' 
                  ? 'Presiona "Conectar" para generar el QR'
                  : 'Esperando QR...'
                }
              </p>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        {needsQR && !isConnected && (
          <div className="text-center space-y-2 animate-in fade-in duration-500">
            <p className="text-sm text-muted-foreground">
              1. Abre WhatsApp en tu teléfono
            </p>
            <p className="text-sm text-muted-foreground">
              2. Toca <span className="font-semibold">Menú</span> o{" "}
              <span className="font-semibold">Configuración</span> y selecciona{" "}
              <span className="font-semibold">Dispositivos vinculados</span>
            </p>
            <p className="text-sm text-muted-foreground">
              3. Escanea este código QR
            </p>
          </div>
        )}

        {isConnected && (
          <p className="text-sm text-muted-foreground animate-in fade-in duration-500 text-center">
            Tu sesión de WhatsApp está activa y lista para usar
          </p>
        )}

        {/* Botones de control */}
        <div className="flex gap-3 flex-wrap justify-center">
          {status.status === 'disconnected' && (
            <Button 
              onClick={handleInitialize}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Conectar
            </Button>
          )}

          {(status.status === 'qr_received' || status.status === 'authenticating') && (
            <Button 
              onClick={handleInitialize}
              disabled={isLoading}
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar QR
            </Button>
          )}

          {isConnected && (
            <Button 
              onClick={handleDisconnect}
              disabled={isLoading}
              variant="destructive"
            >
              Desconectar
            </Button>
          )}

          {(hasSession || status.status !== 'disconnected') && (
            <Button 
              onClick={handleClearSession}
              disabled={isLoading}
              variant="outline"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Sesión
            </Button>
          )}
        </div>

        {/* Estado del backend */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span>Backend: {error ? 'Desconectado' : 'Conectado'}</span>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-1 max-w-md mx-auto">
              {error}
            </p>
          )}
        </div>

        {/* Información de debug en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-4">
            <p>Estado: {status.status}</p>
            <p>Listo: {status.isReady ? 'Sí' : 'No'}</p>
            <p>Tiene sesión: {hasSession ? 'Sí' : 'No'}</p>
            {error && <p className="text-destructive">Error: {error}</p>}
          </div>
        )}
      </div>
    </Card>
  );
};

export default QRConnection;
