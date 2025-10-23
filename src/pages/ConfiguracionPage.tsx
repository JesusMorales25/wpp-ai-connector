import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Server, 
  Bot, 
  Shield, 
  Clock, 
  MessageSquare, 
  Wifi, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Link,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Bell,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG } from '@/lib/api-config';

interface BotConfig {
  enabled: boolean;
  autoReply: boolean;
  ignoreGroups: boolean;
  ignoreOwnMessages: boolean;
  responseDelay: number;
  maxMessagesPerMinute: number;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  weekendMode: boolean;
}

interface ConnectionConfig {
  whatsappApiUrl: string;
  aiBackendUrl: string;
  backendApiUrl: string;
  requestTimeout: number;
  pollingInterval: number;
  retryAttempts: number;
}

interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  newMessages: boolean;
  connectionStatus: boolean;
  errors: boolean;
}

interface AppearanceConfig {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  compactMode: boolean;
  animations: boolean;
}

const ConfiguracionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Estados de configuración
  const [botConfig, setBotConfig] = useState<BotConfig>({
    enabled: true,
    autoReply: true,
    ignoreGroups: true,
    ignoreOwnMessages: true,
    responseDelay: 2000,
    maxMessagesPerMinute: 30,
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '18:00'
    },
    weekendMode: false
  });

  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    whatsappApiUrl: API_CONFIG.WHATSAPP_API_URL || 'http://localhost:3001',
    aiBackendUrl: API_CONFIG.AI_BOT_URL || '',
    backendApiUrl: API_CONFIG.BACKEND_API_URL || 'http://localhost:8081',
    requestTimeout: API_CONFIG.REQUEST_TIMEOUT || 10000,
    pollingInterval: API_CONFIG.POLLING_INTERVAL || 5000,
    retryAttempts: 3
  });

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    enabled: true,
    sound: true,
    desktop: true,
    newMessages: true,
    connectionStatus: true,
    errors: true
  });

  const [appearanceConfig, setAppearanceConfig] = useState<AppearanceConfig>({
    theme: 'system',
    language: 'es',
    compactMode: false,
    animations: true
  });

  // Cargar configuración
  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Cargar configuraciones desde localStorage o API
      const savedBotConfig = localStorage.getItem('botConfig');
      if (savedBotConfig) {
        setBotConfig(JSON.parse(savedBotConfig));
      }

      const savedConnectionConfig = localStorage.getItem('connectionConfig');
      if (savedConnectionConfig) {
        setConnectionConfig(JSON.parse(savedConnectionConfig));
      }

      const savedNotificationConfig = localStorage.getItem('notificationConfig');
      if (savedNotificationConfig) {
        setNotificationConfig(JSON.parse(savedNotificationConfig));
      }

      const savedAppearanceConfig = localStorage.getItem('appearanceConfig');
      if (savedAppearanceConfig) {
        setAppearanceConfig(JSON.parse(savedAppearanceConfig));
      }

      // También intentar obtener configuración del bot desde el servidor
      try {
        const response = await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/stats`);
        if (response.ok) {
          const data = await response.json();
          setBotConfig(prev => ({
            ...prev,
            enabled: data.autoBotEnabled || false
          }));
        }
      } catch (error) {
        console.warn('No se pudo obtener configuración del servidor:', error);
      }

    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración
  const saveConfiguration = async () => {
    setSaveLoading(true);
    try {
      // Guardar en localStorage
      localStorage.setItem('botConfig', JSON.stringify(botConfig));
      localStorage.setItem('connectionConfig', JSON.stringify(connectionConfig));
      localStorage.setItem('notificationConfig', JSON.stringify(notificationConfig));
      localStorage.setItem('appearanceConfig', JSON.stringify(appearanceConfig));

      // Actualizar configuración del bot en el servidor
      try {
        const response = await fetch(`${API_CONFIG.WHATSAPP_API_URL}/api/whatsapp/toggle-autobot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: botConfig.enabled }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar configuración del bot');
        }
      } catch (error) {
        console.warn('No se pudo actualizar configuración del servidor:', error);
      }

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaveLoading(false);
    }
  };

  // Resetear configuración
  const resetConfiguration = () => {
    setBotConfig({
      enabled: true,
      autoReply: true,
      ignoreGroups: true,
      ignoreOwnMessages: true,
      responseDelay: 2000,
      maxMessagesPerMinute: 30,
      workingHours: {
        enabled: false,
        start: '09:00',
        end: '18:00'
      },
      weekendMode: false
    });

    setConnectionConfig({
      whatsappApiUrl: 'http://localhost:3001',
      aiBackendUrl: '',
      backendApiUrl: 'http://localhost:8081',
      requestTimeout: 10000,
      pollingInterval: 5000,
      retryAttempts: 3
    });

    setNotificationConfig({
      enabled: true,
      sound: true,
      desktop: true,
      newMessages: true,
      connectionStatus: true,
      errors: true
    });

    setAppearanceConfig({
      theme: 'system',
      language: 'es',
      compactMode: false,
      animations: true
    });

    toast.success('Configuración restablecida a valores por defecto');
  };

  // Exportar configuración
  const exportConfiguration = () => {
    const config = {
      botConfig,
      connectionConfig,
      notificationConfig,
      appearanceConfig,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `whatsapp-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Configuración exportada exitosamente');
  };

  // Importar configuración
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        
        if (config.botConfig) setBotConfig(config.botConfig);
        if (config.connectionConfig) setConnectionConfig(config.connectionConfig);
        if (config.notificationConfig) setNotificationConfig(config.notificationConfig);
        if (config.appearanceConfig) setAppearanceConfig(config.appearanceConfig);
        
        toast.success('Configuración importada exitosamente');
      } catch (error) {
        toast.error('Error al importar configuración. Archivo inválido.');
      }
    };
    
    reader.readAsText(file);
  };

  // Probar conexión
  const testConnection = async (url: string, type: 'whatsapp' | 'ai' | 'backend') => {
    try {
      toast.info(`Probando conexión ${type}...`);
      
      let testUrl = url;
      if (type === 'whatsapp') {
        testUrl = `${url}/api/health`;
      } else if (type === 'backend') {
        testUrl = `${url}/api/health`;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(`Conexión ${type} exitosa`);
      } else {
        toast.error(`Error en conexión ${type}: ${response.status}`);
      }
    } catch (error) {
      toast.error(`Error en conexión ${type}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Configuración del Sistema
              </h1>
              <p className="text-sm text-muted-foreground">
                Personaliza y configura tu WhatsApp AI Connector
              </p>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={saveConfiguration} 
              disabled={saveLoading}
              className="bg-gradient-primary"
            >
              {saveLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Configuración
            </Button>
            
            <Button onClick={resetConfiguration} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restablecer
            </Button>
            
            <Button onClick={exportConfiguration} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importConfiguration}
                className="hidden"
                id="import-config"
              />
              <Button 
                onClick={() => document.getElementById('import-config')?.click()}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
          {/* Configuración del Bot */}
          <div className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <CardTitle>Configuración del Bot IA</CardTitle>
                </div>
                <CardDescription>
                  Controla el comportamiento del bot automático
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Bot Automático</h4>
                    <p className="text-sm text-muted-foreground">
                      Activar/desactivar respuestas automáticas
                    </p>
                  </div>
                  <Switch
                    checked={botConfig.enabled}
                    onCheckedChange={(checked) => 
                      setBotConfig(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Respuesta Automática</h4>
                    <p className="text-sm text-muted-foreground">
                      Responder automáticamente a mensajes
                    </p>
                  </div>
                  <Switch
                    checked={botConfig.autoReply}
                    onCheckedChange={(checked) => 
                      setBotConfig(prev => ({ ...prev, autoReply: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Ignorar Grupos</h4>
                    <p className="text-sm text-muted-foreground">
                      No responder en conversaciones grupales
                    </p>
                  </div>
                  <Switch
                    checked={botConfig.ignoreGroups}
                    onCheckedChange={(checked) => 
                      setBotConfig(prev => ({ ...prev, ignoreGroups: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Ignorar Mensajes Propios</h4>
                    <p className="text-sm text-muted-foreground">
                      No procesar mensajes enviados por ti
                    </p>
                  </div>
                  <Switch
                    checked={botConfig.ignoreOwnMessages}
                    onCheckedChange={(checked) => 
                      setBotConfig(prev => ({ ...prev, ignoreOwnMessages: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Retraso de Respuesta (ms)
                  </label>
                  <Input
                    type="number"
                    value={botConfig.responseDelay}
                    onChange={(e) => 
                      setBotConfig(prev => ({ 
                        ...prev, 
                        responseDelay: parseInt(e.target.value) || 0 
                      }))
                    }
                    min="0"
                    max="30000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo de espera antes de responder (0-30000ms)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Máximo Mensajes por Minuto
                  </label>
                  <Input
                    type="number"
                    value={botConfig.maxMessagesPerMinute}
                    onChange={(e) => 
                      setBotConfig(prev => ({ 
                        ...prev, 
                        maxMessagesPerMinute: parseInt(e.target.value) || 1 
                      }))
                    }
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Límite para evitar spam (1-100 mensajes)
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Horario de Trabajo</h4>
                    <Switch
                      checked={botConfig.workingHours.enabled}
                      onCheckedChange={(checked) => 
                        setBotConfig(prev => ({ 
                          ...prev, 
                          workingHours: { ...prev.workingHours, enabled: checked }
                        }))
                      }
                    />
                  </div>
                  
                  {botConfig.workingHours.enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Inicio</label>
                        <Input
                          type="time"
                          value={botConfig.workingHours.start}
                          onChange={(e) => 
                            setBotConfig(prev => ({ 
                              ...prev, 
                              workingHours: { ...prev.workingHours, start: e.target.value }
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fin</label>
                        <Input
                          type="time"
                          value={botConfig.workingHours.end}
                          onChange={(e) => 
                            setBotConfig(prev => ({ 
                              ...prev, 
                              workingHours: { ...prev.workingHours, end: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Modo Fin de Semana</h4>
                    <p className="text-sm text-muted-foreground">
                      Reducir actividad en fines de semana
                    </p>
                  </div>
                  <Switch
                    checked={botConfig.weekendMode}
                    onCheckedChange={(checked) => 
                      setBotConfig(prev => ({ ...prev, weekendMode: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Conexiones */}
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  <CardTitle>Configuración de Conexiones</CardTitle>
                </div>
                <CardDescription>
                  URLs y configuración de servicios backend
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">WhatsApp API URL</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(connectionConfig.whatsappApiUrl, 'whatsapp')}
                    >
                      <Wifi className="w-3 h-3 mr-1" />
                      Probar
                    </Button>
                  </div>
                  <Input
                    value={connectionConfig.whatsappApiUrl}
                    onChange={(e) => 
                      setConnectionConfig(prev => ({ 
                        ...prev, 
                        whatsappApiUrl: e.target.value 
                      }))
                    }
                    placeholder="http://localhost:3001"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">IA Backend URL</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(connectionConfig.aiBackendUrl, 'ai')}
                    >
                      <Wifi className="w-3 h-3 mr-1" />
                      Probar
                    </Button>
                  </div>
                  <Input
                    value={connectionConfig.aiBackendUrl}
                    onChange={(e) => 
                      setConnectionConfig(prev => ({ 
                        ...prev, 
                        aiBackendUrl: e.target.value 
                      }))
                    }
                    placeholder="https://tu-bot-ia.herokuapp.com/api/chat/send"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Backend API URL</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(connectionConfig.backendApiUrl, 'backend')}
                    >
                      <Wifi className="w-3 h-3 mr-1" />
                      Probar
                    </Button>
                  </div>
                  <Input
                    value={connectionConfig.backendApiUrl}
                    onChange={(e) => 
                      setConnectionConfig(prev => ({ 
                        ...prev, 
                        backendApiUrl: e.target.value 
                      }))
                    }
                    placeholder="http://localhost:8081"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeout (ms)</label>
                    <Input
                      type="number"
                      value={connectionConfig.requestTimeout}
                      onChange={(e) => 
                        setConnectionConfig(prev => ({ 
                          ...prev, 
                          requestTimeout: parseInt(e.target.value) || 5000 
                        }))
                      }
                      min="1000"
                      max="60000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Polling (ms)</label>
                    <Input
                      type="number"
                      value={connectionConfig.pollingInterval}
                      onChange={(e) => 
                        setConnectionConfig(prev => ({ 
                          ...prev, 
                          pollingInterval: parseInt(e.target.value) || 3000 
                        }))
                      }
                      min="1000"
                      max="30000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reintentos de Conexión</label>
                  <Input
                    type="number"
                    value={connectionConfig.retryAttempts}
                    onChange={(e) => 
                      setConnectionConfig(prev => ({ 
                        ...prev, 
                        retryAttempts: parseInt(e.target.value) || 3 
                      }))
                    }
                    min="1"
                    max="10"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notificaciones y Apariencia */}
          <div className="space-y-6">
            {/* Configuración de Notificaciones */}
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle>Notificaciones</CardTitle>
                </div>
                <CardDescription>
                  Controla cómo recibes notificaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificaciones</h4>
                    <p className="text-sm text-muted-foreground">
                      Activar/desactivar todas las notificaciones
                    </p>
                  </div>
                  <Switch
                    checked={notificationConfig.enabled}
                    onCheckedChange={(checked) => 
                      setNotificationConfig(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                {notificationConfig.enabled && (
                  <>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sonidos</h4>
                        <p className="text-sm text-muted-foreground">
                          Reproducir sonidos de notificación
                        </p>
                      </div>
                      <Switch
                        checked={notificationConfig.sound}
                        onCheckedChange={(checked) => 
                          setNotificationConfig(prev => ({ ...prev, sound: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificaciones de Escritorio</h4>
                        <p className="text-sm text-muted-foreground">
                          Mostrar notificaciones del navegador
                        </p>
                      </div>
                      <Switch
                        checked={notificationConfig.desktop}
                        onCheckedChange={(checked) => 
                          setNotificationConfig(prev => ({ ...prev, desktop: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Nuevos Mensajes</h4>
                        <p className="text-sm text-muted-foreground">
                          Notificar cuando lleguen mensajes
                        </p>
                      </div>
                      <Switch
                        checked={notificationConfig.newMessages}
                        onCheckedChange={(checked) => 
                          setNotificationConfig(prev => ({ ...prev, newMessages: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Estado de Conexión</h4>
                        <p className="text-sm text-muted-foreground">
                          Notificar cambios de conexión
                        </p>
                      </div>
                      <Switch
                        checked={notificationConfig.connectionStatus}
                        onCheckedChange={(checked) => 
                          setNotificationConfig(prev => ({ ...prev, connectionStatus: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Errores</h4>
                        <p className="text-sm text-muted-foreground">
                          Notificar errores del sistema
                        </p>
                      </div>
                      <Switch
                        checked={notificationConfig.errors}
                        onCheckedChange={(checked) => 
                          setNotificationConfig(prev => ({ ...prev, errors: checked }))
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Configuración de Apariencia */}
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  <CardTitle>Apariencia</CardTitle>
                </div>
                <CardDescription>
                  Personaliza la interfaz de usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tema</label>
                  <Select 
                    value={appearanceConfig.theme} 
                    onValueChange={(value: 'light' | 'dark' | 'system') => 
                      setAppearanceConfig(prev => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Claro
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          Oscuro
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Idioma</label>
                  <Select 
                    value={appearanceConfig.language} 
                    onValueChange={(value: 'es' | 'en') => 
                      setAppearanceConfig(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Modo Compacto</h4>
                    <p className="text-sm text-muted-foreground">
                      Reducir espaciado en la interfaz
                    </p>
                  </div>
                  <Switch
                    checked={appearanceConfig.compactMode}
                    onCheckedChange={(checked) => 
                      setAppearanceConfig(prev => ({ ...prev, compactMode: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Animaciones</h4>
                    <p className="text-sm text-muted-foreground">
                      Activar animaciones de transición
                    </p>
                  </div>
                  <Switch
                    checked={appearanceConfig.animations}
                    onCheckedChange={(checked) => 
                      setAppearanceConfig(prev => ({ ...prev, animations: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Estado del Sistema */}
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle>Estado del Sistema</CardTitle>
                </div>
                <CardDescription>
                  Información y herramientas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-lg font-bold text-green-600">Online</div>
                    <div className="text-xs text-muted-foreground">WhatsApp API</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-lg">
                    <div className="text-lg font-bold text-blue-600">v1.0.0</div>
                    <div className="text-xs text-muted-foreground">Versión</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Herramientas del Sistema</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">
                      <Database className="w-3 h-3 mr-1" />
                      Limpiar Caché
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reiniciar Bot
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;