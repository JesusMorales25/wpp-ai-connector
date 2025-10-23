import { useState, useEffect } from "react";
import { Radio, Users, Send, Upload, Download, AlertTriangle, CheckCircle2, Clock, X, Plus, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import { API_CONFIG } from "@/lib/api-config";
import { backendApi } from "@/services/backend-api.service";
import { LeadDTO } from "@/types/api";
import { toast } from "sonner";

// Tipos adicionales para la API
interface Lead {
  nombre: string | null;
  numeroUsuario: string;
  telefono: string | null;
  correo: string | null;
  categoria: 'CURIOSO' | 'REGISTRO' | 'INTERESADO' | 'CONVERTIDO' | 'PERDIDO';
}

interface Conversation {
  telefono: string;
  numeroContacto?: string;
  nombreContacto?: string;
}

interface Contact {
  id: string;
  numero: string;
  nombre?: string;
  grupo?: string;
}

interface AvailableContact {
  id: string;
  telefono: string;
  nombre: string;
  categoria?: string;
  origen?: string;
}

interface CampaignMessage {
  id: string;
  numero: string;
  nombre?: string;
  mensaje: string;
  estado: "pendiente" | "enviando" | "enviado" | "error";
  timestamp?: Date;
  error?: string;
}

const DifusionPage = () => {
  const { isConnected } = useWhatsApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableContacts, setAvailableContacts] = useState<AvailableContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [newContact, setNewContact] = useState({ numero: "", nombre: "", grupo: "" });
  const [campaign, setCampaign] = useState<CampaignMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAvailableContacts, setShowAvailableContacts] = useState(false);

  // Cargar contactos disponibles desde el backend
  const loadAvailableContacts = async () => {
    setLoadingContacts(true);
    try {
      let allContacts: AvailableContact[] = [];

      // Cargar leads usando el servicio oficial
      try {
        console.log('🔄 Cargando leads desde el backend...');
        const leads = await backendApi.getLeadsData();
        console.log('📊 Leads obtenidos:', leads.length, leads);
        
        allContacts = [
          ...allContacts,
          ...leads
            .filter((lead: LeadDTO) => lead.telefono) // Solo leads con teléfono
            .map((lead: LeadDTO) => ({
              id: `lead-${lead.numeroUsuario}`,
              telefono: lead.telefono!,
              nombre: lead.nombre || lead.numeroUsuario,
              categoria: lead.categoria || 'Lead',
              origen: 'Leads'
            }))
        ];
        console.log('✅ Leads procesados para difusión:', allContacts.length);
      } catch (error) {
        console.error('❌ Error loading leads:', error);
        toast.error('Error al cargar leads: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }

      // Intentar obtener contactos de conversaciones también
      try {
        // Cargar conversaciones existentes para obtener más contactos
        const conversacionesResponse = await fetch(`${API_CONFIG.BACKEND_API_URL}/api/conversaciones/all`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (conversacionesResponse.ok) {
          const conversacionesData = await conversacionesResponse.json();
          const conversaciones = conversacionesData.conversaciones || [];
          
          // Extraer contactos únicos de conversaciones
          const contactosConversaciones = conversaciones
            .filter((conv: Conversation) => conv.numeroContacto && conv.nombreContacto)
            .map((conv: Conversation) => ({
              id: `conv-${conv.numeroContacto}`,
              telefono: conv.numeroContacto,
              nombre: conv.nombreContacto,
              categoria: 'Conversación',
              origen: 'Conversaciones'
            }));

          // Eliminar duplicados por teléfono
          const telefonosExistentes = new Set(allContacts.map(c => c.telefono));
          const contactosNuevos = contactosConversaciones.filter(
            (conv: Conversation) => !telefonosExistentes.has(conv.telefono)
          );

          allContacts = [...allContacts, ...contactosNuevos];
        }
      } catch (error) {
        console.log('No se pudieron cargar conversaciones:', error);
      }

      setAvailableContacts(allContacts);
      if (allContacts.length > 0) {
        toast.success(`${allContacts.length} contactos disponibles cargados`);
      } else {
        toast.info('No se encontraron contactos disponibles');
      }
    } catch (error) {
      console.error('Error loading available contacts:', error);
      toast.error('Error al cargar contactos disponibles');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Cargar contactos al montar el componente
  useEffect(() => {
    loadAvailableContacts();
  }, []);

  // Agregar contacto desde la lista disponible
  const addFromAvailable = (availableContact: AvailableContact) => {
    if (contacts.some(c => c.numero === availableContact.telefono)) {
      toast.error("Este contacto ya está en la lista");
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      numero: availableContact.telefono,
      nombre: availableContact.nombre,
      grupo: availableContact.categoria,
    };

    setContacts(prev => [...prev, contact]);
    toast.success(`${availableContact.nombre} agregado a la difusión`);
  };

  // Agregar contacto individual
  const addContact = () => {
    if (!newContact.numero.trim()) {
      toast.error("El número es requerido");
      return;
    }

    if (contacts.some(c => c.numero === newContact.numero)) {
      toast.error("Este número ya está en la lista");
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      numero: newContact.numero.trim(),
      nombre: newContact.nombre.trim() || undefined,
      grupo: newContact.grupo.trim() || undefined,
    };

    setContacts(prev => [...prev, contact]);
    setNewContact({ numero: "", nombre: "", grupo: "" });
    setShowAddContact(false);
    toast.success("Contacto agregado");
  };

  // Eliminar contacto
  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    toast.success("Contacto eliminado");
  };

  // Importar desde CSV/texto
  const importContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      let imported = 0;
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        const numero = parts[0];
        
        if (numero && !contacts.some(c => c.numero === numero)) {
          const contact: Contact = {
            id: `${Date.now()}-${Math.random()}`,
            numero,
            nombre: parts[1] || undefined,
            grupo: parts[2] || undefined,
          };
          setContacts(prev => [...prev, contact]);
          imported++;
        }
      });
      
      toast.success(`${imported} contactos importados`);
    };
    
    reader.readAsText(file);
  };

  // Función para marcar números como en difusión masiva
  const markNumbersInBroadcast = async (numeros: string[], isActive: boolean) => {
    try {
      await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/broadcast-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numeros: numeros,
          isActive: isActive, // true = activar modo difusión, false = desactivar
          duration: 300000 // 5 minutos en milisegundos
        }),
      });
    } catch (error) {
      console.warn('No se pudo configurar el modo difusión:', error);
    }
  };

  // Función para enviar mensaje real por WhatsApp
  const sendWhatsAppMessage = async (numero: string, mensaje: string) => {
    const response = await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero: numero,
        mensaje: mensaje,
        isDifusion: true, // Marcador para que el bot automático ignore estos mensajes
        source: 'difusion_masiva' // Identificador del origen
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result;
  };

  // Ejecutar campaña de difusión
  const runCampaign = async () => {
    if (!isConnected) {
      toast.error("Debes conectar WhatsApp primero");
      return;
    }

    if (contacts.length === 0) {
      toast.error("Agrega contactos a la lista");
      return;
    }

    if (!mensaje.trim()) {
      toast.error("Escribe el mensaje a enviar");
      return;
    }

    setIsRunning(true);
    setProgress(0);

    // Crear campaña
    const campaignMessages: CampaignMessage[] = contacts.map(contact => ({
      id: `msg-${contact.id}`,
      numero: contact.numero,
      nombre: contact.nombre,
      mensaje: mensaje.trim(),
      estado: "pendiente"
    }));

    setCampaign(campaignMessages);

    // Activar modo difusión para todos los números
    const numeros = contacts.map(c => c.numero);
    await markNumbersInBroadcast(numeros, true);
    
    toast.info("Iniciando difusión masiva...");

    // Envío progresivo con API real
    for (let i = 0; i < campaignMessages.length; i++) {
      const message = campaignMessages[i];
      
      // Actualizar estado a "enviando"
      setCampaign(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, estado: "enviando" as const }
          : msg
      ));

      try {
        // Enviar mensaje real por WhatsApp
        await sendWhatsAppMessage(message.numero, message.mensaje);
        
        setCampaign(prev => prev.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                estado: "enviado" as const,
                timestamp: new Date()
              }
            : msg
        ));

        toast.success(`Mensaje enviado a ${message.nombre || message.numero}`);

        // Delay anti-spam y anti-procesamiento (3 segundos entre envíos)
        if (i < campaignMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        setCampaign(prev => prev.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                estado: "error" as const,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : "Error desconocido"
              }
            : msg
        ));
        toast.error(`Error enviando a ${message.nombre || message.numero}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }

      // Actualizar progreso
      setProgress(((i + 1) / campaignMessages.length) * 100);
    }

    // Desactivar modo difusión para todos los números
    await markNumbersInBroadcast(numeros, false);

    setIsRunning(false);
    toast.success("Campaña de difusión completada - Bot automático reactivado");
  };

  // Limpiar campaña
  const clearCampaign = () => {
    setCampaign([]);
    setProgress(0);
  };

  // Estadísticas de la campaña
  const stats = {
    total: campaign.length,
    enviados: campaign.filter(m => m.estado === "enviado").length,
    errores: campaign.filter(m => m.estado === "error").length,
    pendientes: campaign.filter(m => m.estado === "pendiente").length,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
              <Radio className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Difusión Masiva WhatsApp
              </h1>
              <p className="text-sm text-muted-foreground">
                Envía mensajes a múltiples contactos simultáneamente
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
                  ? '✅ WhatsApp conectado - Listo para difusión' 
                  : '⚠️ WhatsApp no conectado - Conecta primero en "Conexión WhatsApp"'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          {/* Panel de configuración */}
          <div className="space-y-6">
            {/* Lista de contactos */}
            <Card className="p-6 shadow-elegant">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contactos</h3>
                  <Badge variant="secondary">{contacts.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowAvailableContacts(!showAvailableContacts)}
                    size="sm"
                    variant="outline"
                    disabled={loadingContacts}
                    className="flex-1 min-w-0 sm:flex-none"
                  >
                    <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{loadingContacts ? 'Cargando...' : 'Disponibles'}</span>
                    <span className="sm:hidden">{loadingContacts ? 'Cargando...' : 'Disp.'}</span>
                    <Badge className="ml-1 sm:ml-2">{availableContacts.length}</Badge>
                  </Button>
                  <Button
                    onClick={() => setShowAddContact(true)}
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-0 sm:flex-none"
                  >
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Agregar</span>
                    <span className="sm:hidden">Nuevo</span>
                  </Button>
                  <Button
                    onClick={() => document.getElementById('file-input')?.click()}
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-0 sm:flex-none"
                  >
                    <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Importar</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                </div>
              </div>

              {/* Input oculto para importar archivo */}
              <input
                id="file-input"
                type="file"
                accept=".csv,.txt"
                onChange={importContacts}
                className="hidden"
              />

              {/* Lista de contactos disponibles */}
              {showAvailableContacts && (
                <div className="mb-4 p-4 bg-secondary rounded-lg border">
                  <h4 className="font-medium mb-3">Contactos Disponibles</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableContacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay contactos disponibles
                      </p>
                    ) : (
                      availableContacts.map(contact => (
                        <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background rounded border gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{contact.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              +{contact.telefono} • {contact.origen} • {contact.categoria}
                            </p>
                          </div>
                          <Button
                            onClick={() => addFromAvailable(contact)}
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">Agregar</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Formulario para agregar contacto */}
              {showAddContact && (
                <div className="mb-4 p-4 bg-secondary rounded-lg border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <Input
                      placeholder="Número (requerido)"
                      value={newContact.numero}
                      onChange={(e) => setNewContact(prev => ({ ...prev, numero: e.target.value }))}
                    />
                    <Input
                      placeholder="Nombre (opcional)"
                      value={newContact.nombre}
                      onChange={(e) => setNewContact(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                    <Input
                      placeholder="Grupo (opcional)"
                      value={newContact.grupo}
                      onChange={(e) => setNewContact(prev => ({ ...prev, grupo: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addContact} size="sm">
                      Agregar
                    </Button>
                    <Button 
                      onClick={() => setShowAddContact(false)} 
                      size="sm" 
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de contactos seleccionados */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay contactos agregados</p>
                    <p className="text-xs">Agrega contactos disponibles, manuales o importa desde CSV</p>
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div key={contact.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-secondary rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {contact.nombre || `Contacto ${contact.numero}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{contact.numero} {contact.grupo && `• ${contact.grupo}`}
                        </p>
                      </div>
                      <Button
                        onClick={() => removeContact(contact.id)}
                        size="sm"
                        variant="ghost"
                        disabled={isRunning}
                        className="shrink-0 self-end sm:self-center"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Eliminar</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Mensaje */}
            <Card className="p-6 shadow-elegant">
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Mensaje</h3>
              </div>
              
              <Textarea
                placeholder="Escribe el mensaje que se enviará a todos los contactos..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={6}
                maxLength={1000}
                disabled={isRunning}
              />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {mensaje.length}/1000 caracteres
                </span>
                <Button
                  onClick={runCampaign}
                  disabled={!isConnected || isRunning || contacts.length === 0 || !mensaje.trim()}
                  className="bg-gradient-primary"
                >
                  {isRunning ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4 mr-2" />
                      Iniciar Difusión
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Panel de resultados */}
          <div className="space-y-6">
            {/* Progreso */}
            {campaign.length > 0 && (
              <Card className="p-6 shadow-elegant">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Progreso de Campaña</h3>
                  {!isRunning && (
                    <Button onClick={clearCampaign} size="sm" variant="outline">
                      Limpiar
                    </Button>
                  )}
                </div>

                <Progress value={progress} className="mb-4" />

                {/* Estadísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-900">{stats.total}</p>
                    <p className="text-xs text-blue-600">Total</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-900">{stats.enviados}</p>
                    <p className="text-xs text-green-600">Enviados</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-900">{stats.errores}</p>
                    <p className="text-xs text-red-600">Errores</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-lg font-bold text-amber-900">{stats.pendientes}</p>
                    <p className="text-xs text-amber-600">Pendientes</p>
                  </div>
                </div>

                {/* Lista de resultados */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {campaign.map(message => (
                    <div key={message.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {message.nombre || message.numero}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{message.numero}
                          {message.error && (
                            <span className="text-red-600 ml-2">• {message.error}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {message.estado === "pendiente" && (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                        {message.estado === "enviando" && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            Enviando
                          </Badge>
                        )}
                        {message.estado === "enviado" && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Enviado
                          </Badge>
                        )}
                        {message.estado === "error" && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Información */}
            {campaign.length === 0 && (
              <Card className="p-6 shadow-elegant">
                <h3 className="text-lg font-semibold mb-4">Cómo usar la difusión masiva</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Usa "Disponibles" para agregar leads/contactos existentes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Agrega contactos manualmente o importa desde CSV</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Escribe el mensaje que quieres enviar</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Inicia la difusión y observa el progreso en tiempo real</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ <strong>Importante:</strong> Los mensajes se envían con un delay de 2 segundos entre cada uno para evitar ser marcado como spam por WhatsApp.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifusionPage;