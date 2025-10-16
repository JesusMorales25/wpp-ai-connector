import { useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

interface Message {
  id: string;
  numero: string;
  mensaje: string;
  timestamp: Date;
  status: "sending" | "sent" | "error";
}

interface ChatInterfaceProps {
  isConnected: boolean;
}

const messageSchema = z.object({
  numero: z
    .string()
    .trim()
    .nonempty({ message: "El número es requerido" })
    .regex(/^\d+$/, { message: "El número debe contener solo dígitos" })
    .min(9, { message: "El número debe tener al menos 9 dígitos" })
    .max(15, { message: "El número debe tener máximo 15 dígitos" }),
  mensaje: z
    .string()
    .trim()
    .nonempty({ message: "El mensaje no puede estar vacío" })
    .max(1000, { message: "El mensaje debe tener máximo 1000 caracteres" }),
});

const ChatInterface = ({ isConnected }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [numero, setNumero] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (!isConnected) {
      toast.error("Debes conectarte primero con el código QR");
      return;
    }

    try {
      // Validar inputs
      const validated = messageSchema.parse({ numero, mensaje });

      const newMessage: Message = {
        id: Date.now().toString(),
        numero: validated.numero,
        mensaje: validated.mensaje,
        timestamp: new Date(),
        status: "sending",
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsSending(true);

      const response = await fetch(
        "https://ianeg-bot-backend-up.onrender.com/api/chat/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numero: validated.numero,
            mensaje: validated.mensaje,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
        )
      );

      toast.success("Mensaje enviado correctamente");
      setMensaje("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else if (error instanceof Error) {
        toast.error(`Error al enviar: ${error.message}`);
      } else {
        toast.error("Error al enviar el mensaje");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.status === "sending" ? { ...msg, status: "error" } : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <Card className="flex flex-col h-[600px] shadow-elegant">
      <div className="p-6 border-b border-border bg-gradient-subtle">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Enviar Mensaje WhatsApp
          </h2>
        </div>
        {!isConnected && (
          <p className="text-sm text-destructive mt-2">
            ⚠️ Escanea el código QR primero para conectarte
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No hay mensajes enviados aún</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-secondary rounded-lg p-4 animate-in slide-in-from-bottom duration-300"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-foreground">+{msg.numero}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    msg.status === "sent"
                      ? "bg-primary/20 text-primary"
                      : msg.status === "error"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.status === "sent"
                    ? "Enviado"
                    : msg.status === "error"
                    ? "Error"
                    : "Enviando..."}
                </span>
              </div>
              <p className="text-sm text-foreground mb-2">{msg.mensaje}</p>
              <p className="text-xs text-muted-foreground">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 border-t border-border">
        <div className="space-y-4">
          <Input
            placeholder="Número de teléfono (ej: 977292965)"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            disabled={!isConnected || isSending}
            className="transition-all"
            maxLength={15}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Escribe tu mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              disabled={!isConnected || isSending}
              className="flex-1 transition-all"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!isConnected || isSending || !numero || !mensaje}
              className="bg-gradient-primary shadow-elegant hover:shadow-strong transition-all"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default ChatInterface;
