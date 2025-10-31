import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CalendarIcon, 
  RefreshCw, 
  MessageSquare, 
  Users, 
  Bot, 
  Activity,
  TrendingUp,
  Clock,
  Phone
} from 'lucide-react';
import { backendApi } from '@/services/backend-api.service';
import { toast } from '@/hooks/use-toast';
import { MetricasResponse } from '@/types/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Colores para gráficos
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981', 
  accent: '#f59e0b',
  warning: '#ef4444',
  info: '#8b5cf6',
  success: '#06b6d4'
};

const CATEGORIA_COLORS = {
  CURIOSO: '#3b82f6',
  REGISTRO: '#10b981',
  PROSPECTO: '#f59e0b',
  INTERESADO: '#8b5cf6',
  CONVERTIDO: '#06b6d4',
  PERDIDO: '#ef4444'
};

const MetricasPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [metricas, setMetricas] = useState<MetricasResponse | null>(null);
  const [periodo, setPeriodo] = useState('7');

  const fetchMetricas = useCallback(async () => {
    try {
      setLoading(true);
      
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaFin.getDate() - parseInt(periodo));

      const response = await backendApi.getMetricas({
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0]
      });

      console.log('📊 Respuesta de métricas:', response);
      setMetricas(response);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    fetchMetricas();
  }, [fetchMetricas]);

  // Procesar datos para gráficos
  const mensajesPorDiaChart = (metricas?.mensajes_por_dia || []).map(item => ({
    ...item,
    fechaFormateada: format(parseISO(item.fecha), 'dd/MM', { locale: es })
  }));

  const categoriasDistribucion = (metricas?.contactos_recientes || []).reduce((acc, contacto) => {
    acc[contacto.categoria] = (acc[contacto.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoriasChart = Object.entries(categoriasDistribucion).map(([categoria, cantidad]) => ({
    name: categoria, // Usar 'name' para que la Legend funcione correctamente
    categoria,
    cantidad,
    color: CATEGORIA_COLORS[categoria as keyof typeof CATEGORIA_COLORS] || '#6b7280'
  }));

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Métricas del Período</h1>
          <p className="text-sm text-muted-foreground">
            Análisis completo de actividad para los últimos {periodo} días
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último día</SelectItem>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="15">Últimos 15 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="60">Últimos 60 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={fetchMetricas} 
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando métricas...</span>
        </div>
      ) : metricas ? (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{metricas?.totales?.total_mensajes?.toLocaleString?.() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Bot: {metricas?.totales?.total_mensajes_bot ?? 0} | 
                  Usuario: {metricas?.totales?.total_mensajes_usuario ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contactos Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{metricas?.totales?.contactos_activos?.toLocaleString?.() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total conversaciones: {metricas?.totales?.total_conversaciones ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {((metricas?.totales?.tasa_respuesta ?? 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Efectividad de respuestas automáticas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Gráfico de mensajes por día */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Mensajes por Día</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <AreaChart data={mensajesPorDiaChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fechaFormateada" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(label) => `Fecha: ${label}`}
                      formatter={(value) => [value, 'Mensajes']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total_mensajes" 
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por categorías */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Contactos por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={categoriasChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="cantidad"
                      nameKey="name" // Especificar el campo para los nombres
                    >
                      {categoriasChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, 'Contactos']}
                      labelFormatter={(label) => `Categoría: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de contactos recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Contactos Recientes</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Últimos {(metricas?.contactos_recientes?.length ?? 0)} contactos con actividad
              </p>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {(metricas?.contactos_recientes || []).slice(0, 8).map((contacto) => (
                  <div key={contacto.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <Avatar className="flex-shrink-0">
                        <AvatarFallback>
                          {typeof contacto.nombre === 'string' && contacto.nombre !== null && contacto.nombre !== undefined && contacto.nombre.trim() !== ''
                            ? contacto.nombre.split(' ').map(n => n[0]).join('').toUpperCase()
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {contacto.nombre || 'Usuario sin nombre'}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{contacto.numero_usuario}</span>
                        </div>
                        {contacto.correo && (
                          <div className="text-xs sm:text-sm text-muted-foreground truncate">
                            {contacto.correo}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-sm font-medium">
                          {contacto.total_conversaciones} conversación{contacto.total_conversaciones !== 1 ? 'es' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {contacto.ultima_interaccion ?
                            format(parseISO(contacto.ultima_interaccion), 'dd/MM/yyyy HH:mm', { locale: es })
                            : 'Sin interacción'}
                        </div>
                      </div>
                      <Badge 
                        style={{
                          backgroundColor: CATEGORIA_COLORS[contacto.categoria as keyof typeof CATEGORIA_COLORS] || '#6b7280',
                          color: 'white'
                        }}
                      >
                        {contacto.categoria}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumen adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Bot className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{metricas?.totales?.total_mensajes_bot ?? 0}</div>
                <p className="text-sm text-muted-foreground">Mensajes del Bot</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{metricas?.totales?.total_mensajes_usuario ?? 0}</div>
                <p className="text-sm text-muted-foreground">Mensajes de Usuarios</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Activity className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{Object.keys(categoriasDistribucion).length}</div>
                <p className="text-sm text-muted-foreground">Categorías Activas</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">
                  {metricas?.totales?.contactos_activos > 0 ? 
                    ((metricas?.totales?.total_mensajes ?? 0) / (metricas?.totales?.contactos_activos ?? 1)).toFixed(1) : 
                    '0'
                  }
                </div>
                <p className="text-sm text-muted-foreground">Mensajes por Contacto</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay métricas disponibles para el período seleccionado</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricasPage;
