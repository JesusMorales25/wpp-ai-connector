// Tipos exactos para el backend
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// Tipos para métricas del backend (/api/reportes/metricas)
export interface MetricasResponse {
  totales: {
    tasa_respuesta: number;
    total_mensajes: number;
    contactos_activos: number;
    total_mensajes_bot: number;
    total_conversaciones: number;
    total_mensajes_usuario: number;
  };
  mensajes_por_dia: {
    fecha: string;
    total_mensajes: number;
  }[];
  contactos_recientes: {
    id: number;
    correo: string | null;
    nombre: string | null;
    telefono: string | null;
    categoria: string;
    numero_usuario: string;
    ultima_interaccion: string;
    total_conversaciones: number;
  }[];
}

export interface MetricasFilters {
  fechaInicio: string; // formato YYYY-MM-DD
  fechaFin: string;    // formato YYYY-MM-DD
}

export interface LeadDTO {
  nombre: string | null;
  numeroUsuario: string;
  telefono: string | null;
  correo: string | null;
  categoria: 'CURIOSO' | 'REGISTRO' | 'INTERESADO' | 'CONVERTIDO' | 'PERDIDO';
}

export interface LeadsPorEstadoDTO {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface TotalLeadsHoyDTO {
  total: number;
  crecimiento: number;
  comparacionAyer: number;
}

export interface ConversacionesPorDiaDTO {
  fecha: string;
  cantidad: number;
  duracionPromedio: number;
}

// Tipos específicos para conversaciones del backend
export interface TiempoPromedioRespuestaResponse {
  tiempo_promedio_min: number;
}

// Headers para autenticación
export interface AuthHeaders {
  [key: string]: string;
}

export interface ConversacionDTO {
  id: number;
  contacto: string;
  telefono: string;
  fechaInicio: string;
  fechaFin?: string;
  estado: 'ACTIVA' | 'FINALIZADA' | 'PAUSADA';
  mensajes: number;
  duracion: number;
  ultimoMensaje: string;
  resumen?: string;
}

// Filtros para reportes
export interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
  fuente?: string;
  contacto?: string;
}

// Datos para gráficos
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

// Exportación de datos
export interface ExportOptions {
  formato: 'CSV' | 'EXCEL' | 'PDF';
  campos: string[];
  filtros: FiltrosReporte;
}

// Resumen estadístico
export interface ResumenEstadistico {
  total: number;
  promedio: number;
  maximo: number;
  minimo: number;
  crecimiento: number;
}