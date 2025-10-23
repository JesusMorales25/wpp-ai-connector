// Tipos para mensajería y difusión
export interface ContactInfo {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  etiquetas: string[];
  grupoId?: string;
  fechaUltimoContacto?: string;
  notas?: string;
}

export interface GrupoContactos {
  id: string;
  nombre: string;
  descripcion?: string;
  contactos: ContactInfo[];
  fechaCreacion: string;
  activo: boolean;
}

export interface PlantillaMensaje {
  id: string;
  nombre: string;
  contenido: string;
  variables: string[];
  categoria: 'PROMOCIONAL' | 'INFORMATIVO' | 'SEGUIMIENTO' | 'BIENVENIDA';
  fechaCreacion: string;
}

export interface CampanaDifusion {
  id: string;
  nombre: string;
  descripcion?: string;
  plantillaId: string;
  gruposContactos: string[];
  contactosIndividuales: string[];
  fechaProgramada?: string;
  estado: 'BORRADOR' | 'PROGRAMADA' | 'ENVIANDO' | 'COMPLETADA' | 'CANCELADA';
  estadisticas: {
    total: number;
    enviados: number;
    entregados: number;
    leidos: number;
    errores: number;
  };
  fechaCreacion: string;
  fechaEjecucion?: string;
}

export interface MensajeEnviado {
  id: string;
  destinatario: string;
  contenido: string;
  fechaEnvio: string;
  estado: 'ENVIANDO' | 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'ERROR';
  error?: string;
  campaniaId?: string;
  messageId?: string;
}

// Configuración de mensajería
export interface ConfiguracionMensajeria {
  limitePorMinuto: number;
  limitePorHora: number;
  limitePorDia: number;
  horariosPermitidos: {
    inicio: string;
    fin: string;
  };
  diasPermitidos: number[];
  reintentosMaximos: number;
  timeoutEnvio: number;
}