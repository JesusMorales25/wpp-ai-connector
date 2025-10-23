import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  MessageSquare, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { backendApi } from '@/services/backend-api.service';
import {
  ConversacionesPorDiaDTO,
  TiempoPromedioRespuestaResponse
} from '@/types/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart
} from 'recharts';
import { format, parseISO, subDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface MetricaCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const ConversacionesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los datos de conversaciones
  const [conversacionesHoy, setConversacionesHoy] = useState<number>(0);
  const [totalContactos, setTotalContactos] = useState<number>(0);
  const [tiempoPromedio, setTiempoPromedio] = useState<TiempoPromedioRespuestaResponse | null>(null);
  const [conversacionesPorDia, setConversacionesPorDia] = useState<ConversacionesPorDiaDTO[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Cargando datos de conversaciones...');

      // Cargar todos los datos de conversaciones en paralelo con manejo individual de errores
      const results = await Promise.allSettled([
        backendApi.getConversacionesHoy(),
        backendApi.getTotalContactos(),
        backendApi.getTiempoPromedioRespuesta(),
        backendApi.getConversacionesPorDia()
      ]);

      // Procesar resultados con validación
      const [convHoyResult, contactosResult, tiempoRespResult, convPorDiaResult] = results;

      // Conversaciones hoy
      if (convHoyResult.status === 'fulfilled') {
        const value = convHoyResult.value;
        setConversacionesHoy(typeof value === 'number' && !isNaN(value) ? value : 0);
      } else {
        console.warn('Error al cargar conversaciones hoy:', convHoyResult.reason);
        setConversacionesHoy(0);
      }

      // Total contactos
      if (contactosResult.status === 'fulfilled') {
        const value = contactosResult.value;
        setTotalContactos(typeof value === 'number' && !isNaN(value) ? value : 0);
      } else {
        console.warn('Error al cargar total contactos:', contactosResult.reason);
        setTotalContactos(0);
      }

      // Tiempo promedio respuesta
      if (tiempoRespResult.status === 'fulfilled') {
        const value = tiempoRespResult.value;
        if (value && typeof value.tiempo_promedio_min === 'number' && !isNaN(value.tiempo_promedio_min)) {
          setTiempoPromedio(value);
        } else {
          setTiempoPromedio({ tiempo_promedio_min: 0 });
        }
      } else {
        console.warn('Error al cargar tiempo promedio:', tiempoRespResult.reason);
        setTiempoPromedio({ tiempo_promedio_min: 0 });
      }

      // Conversaciones por día
      if (convPorDiaResult.status === 'fulfilled') {
        const value = convPorDiaResult.value;
        if (Array.isArray(value)) {
          // Validar y limpiar datos
          const cleanData = value.filter(item => 
            item && 
            typeof item.cantidad === 'number' && 
            !isNaN(item.cantidad) &&
            item.fecha &&
            typeof item.fecha === 'string'
          ).map(item => ({
            ...item,
            cantidad: item.cantidad || 0,
            duracionPromedio: typeof item.duracionPromedio === 'number' && !isNaN(item.duracionPromedio) 
              ? item.duracionPromedio 
              : 0
          }));
          setConversacionesPorDia(cleanData);
        } else {
          setConversacionesPorDia([]);
        }
      } else {
        console.warn('Error al cargar conversaciones por día:', convPorDiaResult.reason);
        setConversacionesPorDia([]);
      }

      console.log('✅ Datos de conversaciones cargados:', {
        conversacionesHoy: convHoyResult.status === 'fulfilled' ? convHoyResult.value : 'Error',
        totalContactos: contactosResult.status === 'fulfilled' ? contactosResult.value : 'Error',
        tiempoPromedio: tiempoRespResult.status === 'fulfilled' ? tiempoRespResult.value : 'Error',
        historicoConversaciones: convPorDiaResult.status === 'fulfilled' ? 
          (Array.isArray(convPorDiaResult.value) ? convPorDiaResult.value.length : 0) : 'Error'
      });

    } catch (err) {
      console.error('❌ Error cargando datos de conversaciones:', err);
      setError(err instanceof Error ? err.message : 'Error cargando los datos de conversaciones');
      
      // Valores por defecto en caso de error general
      setConversacionesHoy(0);
      setTotalContactos(0);
      setTiempoPromedio({ tiempo_promedio_min: 0 });
      setConversacionesPorDia([]);
    } finally {
      setLoading(false);
    }
  };

  const generarTarjetasMetricas = (): MetricaCard[] => {
    const tiempoPromedioMin = (tiempoPromedio?.tiempo_promedio_min && !isNaN(tiempoPromedio.tiempo_promedio_min)) 
      ? tiempoPromedio.tiempo_promedio_min 
      : 0;
    
    // Calcular tendencias basadas en datos históricos con validación
    const conversacionesValidas = conversacionesPorDia.filter(dia => 
      dia && typeof dia.cantidad === 'number' && !isNaN(dia.cantidad)
    );
    
    const totalConversacionesHistorico = conversacionesValidas.reduce((sum, dia) => sum + dia.cantidad, 0);
    const promedioConversacionesPorDia = conversacionesValidas.length > 0 ? 
      totalConversacionesHistorico / conversacionesValidas.length : 0;

    // Calcular ratio conversaciones/contactos con validación
    const ratioConversaciones = (totalContactos > 0 && !isNaN(conversacionesHoy)) ? 
      (conversacionesHoy / totalContactos) * 100 : 0;

    // Calcular tendencia de tiempo de respuesta
    const ultimasSemanas = conversacionesValidas.slice(-7);
    const tiempoPromedioSemana = ultimasSemanas.length > 0 ?
      ultimasSemanas.reduce((sum, dia) => sum + (dia.duracionPromedio || 0), 0) / ultimasSemanas.length : 0;

    return [
      {
        title: "Conversaciones Hoy",
        value: (!isNaN(conversacionesHoy) ? conversacionesHoy : 0).toLocaleString(),
        description: "Conversaciones activas hoy",
        icon: MessageSquare,
        trend: !isNaN(conversacionesHoy) && !isNaN(promedioConversacionesPorDia) && promedioConversacionesPorDia > 0 ? 
          conversacionesHoy > promedioConversacionesPorDia ? {
            value: Math.round(((conversacionesHoy - promedioConversacionesPorDia) / promedioConversacionesPorDia) * 100),
            isPositive: true
          } : conversacionesHoy < promedioConversacionesPorDia ? {
            value: Math.round(((promedioConversacionesPorDia - conversacionesHoy) / promedioConversacionesPorDia) * 100),
            isPositive: false
          } : undefined : undefined
      },
      {
        title: "Total Contactos",
        value: (!isNaN(totalContactos) ? totalContactos : 0).toLocaleString(),
        description: "Contactos únicos registrados",
        icon: Users,
        trend: !isNaN(ratioConversaciones) && ratioConversaciones > 0 ? {
          value: Math.round(ratioConversaciones),
          isPositive: ratioConversaciones > 50 // Consideramos bueno > 50% de engagement
        } : undefined
      },
      {
        title: "Tiempo Promedio Respuesta",
        value: `${Math.round(tiempoPromedioMin)} min`,
        description: "Tiempo promedio de respuesta",
        icon: Clock,
        trend: !isNaN(tiempoPromedioMin) && !isNaN(tiempoPromedioSemana) && tiempoPromedioSemana > 0 ? {
          value: Math.round(Math.abs(tiempoPromedioMin - tiempoPromedioSemana)),
          isPositive: tiempoPromedioMin < tiempoPromedioSemana // Menor tiempo es mejor
        } : undefined
      },
      {
        title: "Promedio Diario",
        value: Math.round(promedioConversacionesPorDia || 0).toLocaleString(),
        description: "Conversaciones promedio por día",
        icon: BarChart3,
        trend: conversacionesValidas.length >= 2 ? {
          value: Math.round(promedioConversacionesPorDia || 0),
          isPositive: (promedioConversacionesPorDia || 0) > 0
        } : undefined
      }
    ];
  };

  // Preparar datos para el gráfico combinado con fechas formateadas
  const datosGraficoCombinado = useMemo(() => {
    return conversacionesPorDia
      .filter(dia => dia && dia.fecha && !isNaN(dia.cantidad))
      .map(dia => {
        const fecha = parseISO(dia.fecha);
        return {
          ...dia,
          fechaFormateada: isValid(fecha) ? format(fecha, 'dd/MM', { locale: es }) : dia.fecha,
          tiempoPromedioGlobal: (tiempoPromedio?.tiempo_promedio_min && !isNaN(tiempoPromedio.tiempo_promedio_min)) 
            ? tiempoPromedio.tiempo_promedio_min 
            : 0
        };
      });
  }, [conversacionesPorDia, tiempoPromedio]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Conversaciones</h2>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={cargarDatos} 
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tarjetas de métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {generarTarjetasMetricas().map((metrica) => (
          <Card key={metrica.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metrica.title}</CardTitle>
              <metrica.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrica.value}</div>
              <p className="text-xs text-muted-foreground">{metrica.description}</p>
              {metrica.trend && (
                <div className="flex items-center mt-2">
                  {metrica.trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${metrica.trend.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(metrica.trend.value)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico principal - Tendencia de Conversaciones */}
      {conversacionesPorDia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Conversaciones</CardTitle>
            <CardDescription>Evolución diaria de conversaciones y duración promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={datosGraficoCombinado}>
                <defs>
                  <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'cantidad') return [value, 'Conversaciones'];
                    if (name === 'duracionPromedio') return [`${value} min`, 'Duración del Día'];
                    if (name === 'tiempoPromedioGlobal') return [`${value} min`, 'Promedio Global'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone"
                  dataKey="cantidad" 
                  stroke="#3b82f6"
                  fillOpacity={0.6}
                  fill="url(#colorConversaciones)"
                  name="Conversaciones"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="duracionPromedio" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Duración del Día (min)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tiempoPromedioGlobal" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Promedio Global (min)"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráficos secundarios */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de barras - Conversaciones por día */}
        {conversacionesPorDia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Volumen Diario</CardTitle>
              <CardDescription>Cantidad de conversaciones por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversacionesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="fecha" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Conversaciones']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de líneas - Duración promedio */}
        {conversacionesPorDia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Duración de Conversaciones</CardTitle>
              <CardDescription>Tiempo promedio de conversación por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversacionesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="fecha" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} min`, 'Duración Promedio']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="duracionPromedio" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabla detallada de conversaciones por día */}
      {conversacionesPorDia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Conversaciones por Día</CardTitle>
            <CardDescription>
              Historial completo de actividad diaria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Conversaciones</TableHead>
                    <TableHead>Duración Promedio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comparación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosGraficoCombinado
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .slice(0, 15)
                    .map((dia) => {
                      const fecha = parseISO(dia.fecha);
                      const promedioDiario = datosGraficoCombinado.length > 0 ?
                        datosGraficoCombinado.reduce((sum, d) => sum + d.cantidad, 0) / datosGraficoCombinado.length : 0;
                      const esSuperiorAlPromedio = dia.cantidad > promedioDiario;
                      
                      return (
                        <TableRow key={dia.fecha}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{isValid(fecha) ? format(fecha, 'dd/MM/yyyy', { locale: es }) : dia.fecha}</span>
                              <span className="text-xs text-muted-foreground">
                                {isValid(fecha) ? format(fecha, 'EEEE', { locale: es }) : ''}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{dia.cantidad}</span>
                              {esSuperiorAlPromedio ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={dia.duracionPromedio > 0 ? "default" : "secondary"}>
                              {dia.duracionPromedio > 0 ? `${dia.duracionPromedio.toFixed(1)} min` : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={dia.cantidad > 0 ? "default" : "outline"}
                              className={dia.cantidad > promedioDiario ? "bg-green-100 text-green-800" : ""}
                            >
                              {dia.cantidad > promedioDiario ? 'Alta' : dia.cantidad > 0 ? 'Normal' : 'Sin actividad'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {promedioDiario > 0 ? (
                                <span className={dia.cantidad > promedioDiario ? "text-green-600" : "text-gray-600"}>
                                  {dia.cantidad > promedioDiario ? '+' : ''}
                                  {((dia.cantidad - promedioDiario) / promedioDiario * 100).toFixed(0)}%
                                </span>
                              ) : 'N/A'}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            {datosGraficoCombinado.length > 15 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Mostrando los últimos 15 días de {datosGraficoCombinado.length} registros totales
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen estadístico */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tiempo Promedio</span>
                <Badge variant={tiempoPromedio && tiempoPromedio.tiempo_promedio_min < 5 ? "default" : "secondary"}>
                  {tiempoPromedio?.tiempo_promedio_min.toFixed(1)} min
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Calificación</span>
                <Badge variant={tiempoPromedio && tiempoPromedio.tiempo_promedio_min < 5 ? "default" : 
                               tiempoPromedio && tiempoPromedio.tiempo_promedio_min < 10 ? "secondary" : "destructive"}>
                  {tiempoPromedio && tiempoPromedio.tiempo_promedio_min < 5 ? "Excelente" :
                   tiempoPromedio && tiempoPromedio.tiempo_promedio_min < 10 ? "Bueno" : "Necesita Mejorar"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversaciones Hoy</span>
                <span className="font-bold">{conversacionesHoy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Contactos</span>
                <span className="font-bold">{totalContactos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ratio Actividad</span>
                <Badge variant="outline">
                  {totalContactos > 0 ? ((conversacionesHoy / totalContactos) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversacionesPorDia.length > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Promedio Diario</span>
                    <span className="font-bold">
                      {(conversacionesPorDia.reduce((sum, dia) => sum + dia.cantidad, 0) / conversacionesPorDia.length).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Día más Activo</span>
                    <span className="font-bold">
                      {Math.max(...conversacionesPorDia.map(dia => dia.cantidad))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Días Registrados</span>
                    <Badge variant="outline">{conversacionesPorDia.length}</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};