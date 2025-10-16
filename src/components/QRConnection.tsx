import { useEffect, useState } from "react";
import { QrCode, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface QRConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

const QRConnection = ({ onConnectionChange }: QRConnectionProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simular generación de QR
    setTimeout(() => {
      // En producción, esto vendría de tu backend
      setQrCode("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=WhatsAppConnection");
      setIsLoading(false);
    }, 1500);

    // Simular conexión después de 5 segundos
    const connectionTimer = setTimeout(() => {
      setIsConnected(true);
      onConnectionChange(true);
    }, 6500);

    return () => clearTimeout(connectionTimer);
  }, [onConnectionChange]);

  return (
    <Card className="p-8 shadow-elegant">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <QrCode className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Conexión WhatsApp Web
          </h2>
        </div>

        <div className="relative w-[300px] h-[300px] rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : isConnected ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <CheckCircle2 className="w-20 h-20 text-primary" />
              <p className="text-lg font-semibold text-primary">¡Conectado!</p>
            </div>
          ) : (
            <img
              src={qrCode}
              alt="QR Code"
              className="w-full h-full object-contain animate-in fade-in duration-500"
            />
          )}
        </div>

        {!isConnected && !isLoading && (
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
          <p className="text-sm text-muted-foreground animate-in fade-in duration-500">
            Tu sesión de WhatsApp está activa y lista para usar
          </p>
        )}
      </div>
    </Card>
  );
};

export default QRConnection;
