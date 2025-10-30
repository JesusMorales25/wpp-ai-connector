import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Users, Target, TrendingUp, TrendingDown, Search, Filter, FileText } from 'lucide-react';
import { backendApi } from '@/services/backend-api.service';
import {
  LeadDTO,
  LeadsPorEstadoDTO,
  TotalLeadsHoyDTO
} from '@/types/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Colores para los gráficos de leads por categoría
const CATEGORIA_COLORS = {
  CURIOSO: '#3b82f6',      // Azul
  REGISTRO: '#10b981',     // Verde
  INTERESADO: '#f59e0b',   // Amarillo  
  CONVERTIDO: '#8b5cf6',   // Púrpura
  PERDIDO: '#ef4444',      // Rojo
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

export const LeadsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los datos de leads
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [leadsPorEstado, setLeadsPorEstado] = useState<LeadsPorEstadoDTO[]>([]);
  const [totalLeadsHoy, setTotalLeadsHoy] = useState<TotalLeadsHoyDTO | null>(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [showTable, setShowTable] = useState(true);

  // Filtrado de leads en tiempo real
  const leadsFiltered = useMemo(() => {
    let filtered = leads;

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        (lead.nombre && lead.nombre.toLowerCase().includes(term)) ||
        (lead.numeroUsuario && lead.numeroUsuario.toLowerCase().includes(term)) ||
        (lead.telefono && lead.telefono.toLowerCase().includes(term)) ||
        (lead.correo && lead.correo.toLowerCase().includes(term)) ||
        lead.categoria.toLowerCase().includes(term)
      );
    }

    // Filtrar por categoría
    if (selectedCategoria !== 'TODAS') {
      filtered = filtered.filter(lead => lead.categoria === selectedCategoria);
    }

    return filtered;
  }, [leads, searchTerm, selectedCategoria]);

  // Resumen de categorías para leads filtrados
  const resumenCategorias = useMemo(() => {
    const resumen: Record<string, number> = {};
    leadsFiltered.forEach(lead => {
      resumen[lead.categoria] = (resumen[lead.categoria] || 0) + 1;
    });
    return resumen;
  }, [leadsFiltered]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Cargando datos de leads...');

      // Cargar todos los datos de leads en paralelo
      const [
        leadsData,
        leadsEstado,
        leadsHoy
      ] = await Promise.all([
        backendApi.getLeadsData(),
        backendApi.getLeadsPorEstado(),
        backendApi.getTotalLeadsHoy()
      ]);

      setLeads(leadsData);
      setLeadsPorEstado(leadsEstado);
      setTotalLeadsHoy(leadsHoy);

      console.log('✅ Datos de leads cargados:', {
        totalLeads: leadsData.length,
        estadoDistribution: leadsEstado,
        hoy: leadsHoy
      });

    } catch (err) {
      console.error('❌ Error cargando datos de leads:', err);
      setError(err instanceof Error ? err.message : 'Error cargando los datos de leads');
    } finally {
      setLoading(false);
    }
  };

  const generarTarjetasMetricas = (): MetricaCard[] => {
  const totalLeads = (leads || []).length;
    const leadsHoy = totalLeadsHoy?.total || 0;
    const totalHoy = totalLeadsHoy?.total || 0;
  const registros = (leads || []).filter(l => l.categoria === 'REGISTRO').length;
  const curiosos = (leads || []).filter(l => l.categoria === 'CURIOSO').length;
    
    // Calcular tasa de registro
    const tasaRegistro = totalLeads > 0 ? (registros / totalLeads * 100) : 0;

    return [
      {
        title: "Total de Leads",
        value: totalLeads.toLocaleString(),
        description: "Leads registrados en total",
        icon: Users,
        trend: leadsHoy > 0 ? {
          value: Math.round((leadsHoy / Math.max(totalLeads - leadsHoy, 1)) * 100),
          isPositive: true
        } : undefined
      },
      {
        title: "Leads Hoy",
        value: leadsHoy.toLocaleString(),
        description: "Nuevos leads registrados hoy",
        icon: TrendingUp,
        trend: totalHoy > 0 ? {
          value: Math.abs(totalLeadsHoy?.crecimiento || 0),
          isPositive: (totalLeadsHoy?.crecimiento || 0) > 0
        } : undefined
      },
      {
        title: "Registros Completos",
        value: registros.toLocaleString(),
        description: "Leads con registro completo",
        icon: Target,
        trend: {
          value: Math.round(tasaRegistro),
          isPositive: tasaRegistro > 20 // Consideramos buena una tasa > 20%
        }
      },
      {
        title: "Tasa de Registro",
        value: `${tasaRegistro.toFixed(1)}%`,
        description: "Porcentaje de leads con registro",
        icon: Target,
        trend: {
          value: Math.round(tasaRegistro),
          isPositive: tasaRegistro > 15
        }
      }
    ];
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
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

      {/* Sección de tabla con filtros */}
      <div className="space-y-4">
        {/* Controles de filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, teléfono, correo, número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-80"
              />
            </div>
            
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas las categorías</SelectItem>
                <SelectItem value="CURIOSO">Curioso</SelectItem>
                <SelectItem value="REGISTRO">Registro</SelectItem>
                <SelectItem value="INTERESADO">Interesado</SelectItem>
                <SelectItem value="CONVERTIDO">Convertido</SelectItem>
                <SelectItem value="PERDIDO">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={showTable ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTable(!showTable)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showTable ? 'Ocultar Tabla' : 'Mostrar Tabla'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {(leadsFiltered || []).length} de {(leads || []).length} leads
            </span>
          </div>
        </div>

        {/* Resumen de categorías */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Categoría</CardTitle>
            <CardDescription>
              Distribución de leads {selectedCategoria !== 'TODAS' ? `filtrados por ${selectedCategoria}` : ''} 
              {searchTerm ? ` con búsqueda "${searchTerm}"` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(resumenCategorias).map(([categoria, cantidad]) => (
                <div key={categoria} className="text-center p-4 border rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ 
                      backgroundColor: CATEGORIA_COLORS[categoria as keyof typeof CATEGORIA_COLORS] || '#6b7280' 
                    }}
                  ></div>
                  <div className="text-2xl font-bold">{cantidad}</div>
                  <div className="text-sm text-muted-foreground">{categoria}</div>
                  <Badge variant="secondary">
                    {(leadsFiltered || []).length > 0 ? ((cantidad / (leadsFiltered || []).length) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de leads */}
        {showTable && (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Leads</CardTitle>
              <CardDescription>
                Detalle completo de todos los leads con filtros aplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Número de Usuario</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Categoría</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsFiltered.map((lead, index) => (
                      <TableRow key={`${lead.numeroUsuario}-${index}`}>
                        <TableCell className="font-medium">
                          {lead.nombre || <span className="text-muted-foreground italic">Sin nombre</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {lead.numeroUsuario}
                        </TableCell>
                        <TableCell>
                          {lead.telefono || <span className="text-muted-foreground italic">No disponible</span>}
                        </TableCell>
                        <TableCell>
                          {lead.correo || <span className="text-muted-foreground italic">No disponible</span>}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{ 
                              backgroundColor: CATEGORIA_COLORS[lead.categoria] || '#6b7280',
                              color: 'white'
                            }}
                          >
                            {lead.categoria}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(leadsFiltered || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No se encontraron leads con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráficos de leads */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de barras - Leads por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Categoría</CardTitle>
            <CardDescription>Distribución de leads según su categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={Object.entries(resumenCategorias).map(([categoria, cantidad]) => ({
                name: categoria, // Usar 'name' para consistencia
                categoria,
                cantidad
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" // Usar 'name' en lugar de 'categoria'
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Cantidad']}
                  labelFormatter={(label) => `Categoría: ${label}`}
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

        {/* Gráfico de dona - Porcentaje de leads por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución Porcentual por Categoría</CardTitle>
            <CardDescription>Porcentaje de leads por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={Object.entries(resumenCategorias).map(([categoria, cantidad]) => ({
                    name: categoria, // Usar 'name' en lugar de 'categoria' para la Legend
                    categoria,
                    cantidad,
                    porcentaje: (leadsFiltered || []).length > 0 ? (cantidad / (leadsFiltered || []).length * 100) : 0
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={140}
                  paddingAngle={2}
                  dataKey="cantidad"
                  nameKey="name" // Especificar explícitamente el campo para el nombre
                >
                  {Object.entries(resumenCategorias).map(([categoria], index) => (
                    <Cell 
                      key={`pie-cell-${categoria}-${index}`} 
                      fill={CATEGORIA_COLORS[categoria as keyof typeof CATEGORIA_COLORS] || CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} (${(props.payload.porcentaje || 0).toFixed(1)}%)`,
                    'Leads'
                  ]}
                  labelFormatter={(label) => `Categoría: ${label}`}
                />
                <Legend 
                  formatter={(value, entry) => {
                    // value aquí debería ser la categoría gracias al nameKey
                    const categoria = value;
                    const leadData = Object.entries(resumenCategorias).find(([cat]) => cat === categoria);
                    const porcentaje = leadData && (leadsFiltered || []).length > 0 ? (leadData[1] / (leadsFiltered || []).length * 100) : 0;
                    return (
                      <span style={{ color: entry.color }}>
                        {categoria} ({porcentaje.toFixed(1)}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional de leads de hoy */}
      {totalLeadsHoy && (
        <Card>
          <CardHeader>
            <CardTitle>Leads de Hoy</CardTitle>
            <CardDescription>Detalle de los leads registrados hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalLeadsHoy.total}</div>
                <div className="text-sm text-muted-foreground">Total Hoy</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {totalLeadsHoy.crecimiento > 0 ? '+' : ''}{totalLeadsHoy.crecimiento}%
                </div>
                <div className="text-sm text-muted-foreground">Crecimiento</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {totalLeadsHoy.comparacionAyer}
                </div>
                <div className="text-sm text-muted-foreground">Vs. Ayer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};