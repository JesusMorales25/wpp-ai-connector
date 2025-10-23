import { 
  LoginRequest, 
  LoginResponse,
  MetricasResponse,
  MetricasFilters,
  LeadDTO,
  LeadsPorEstadoDTO,
  TotalLeadsHoyDTO,
  ConversacionesPorDiaDTO,
  TiempoPromedioRespuestaResponse,
  AuthHeaders
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

class BackendApiService {
  
  // Método auxiliar para obtener headers con JWT
  private getAuthHeaders(): AuthHeaders {
    const token = localStorage.getItem('jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Método auxiliar para manejar respuestas
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Para respuestas que no son JSON (ej: números Long)
      const text = await response.text();
      return text as unknown as T;
    }
  }

  // =====================================
  // ENDPOINTS DE AUTENTICACIÓN (/auth)
  // =====================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    return this.handleResponse<LoginResponse>(response);
  }

  // =====================================
  // ENDPOINTS DE REPORTES (/api/reportes)
  // =====================================

  async getMetricas(filters: MetricasFilters): Promise<MetricasResponse> {
    const params = new URLSearchParams({
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin
    });

    const response = await fetch(
      `${API_BASE_URL}/api/reportes/metricas?${params}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders()
      }
    );

    return this.handleResponse<MetricasResponse>(response);
  }

  // =====================================
  // ENDPOINTS DE LEADS (/api/leads)
  // =====================================

  async getLeadsData(): Promise<LeadDTO[]> {
    const response = await fetch(`${API_BASE_URL}/api/leads/datos`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<LeadDTO[]>(response);
  }

  async getLeadsPorEstado(): Promise<LeadsPorEstadoDTO[]> {
    const response = await fetch(`${API_BASE_URL}/api/leads/por-estado`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<LeadsPorEstadoDTO[]>(response);
  }

  async getTotalLeadsHoy(): Promise<TotalLeadsHoyDTO> {
    const response = await fetch(`${API_BASE_URL}/api/leads/total-hoy`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<TotalLeadsHoyDTO>(response);
  }

  // =====================================
  // ENDPOINTS DE CONVERSACIONES (/api/conversaciones)
  // =====================================

  async getConversacionesHoy(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/conversaciones/hoy`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const result = await this.handleResponse<string>(response);
    return parseInt(result as string, 10);
  }

  async getConversacionesPorDia(): Promise<ConversacionesPorDiaDTO[]> {
    const response = await fetch(`${API_BASE_URL}/api/conversaciones/por-dia`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<ConversacionesPorDiaDTO[]>(response);
  }

  async getTiempoPromedioRespuesta(): Promise<TiempoPromedioRespuestaResponse> {
    const response = await fetch(`${API_BASE_URL}/api/conversaciones/tiempo-promedio-respuesta`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<TiempoPromedioRespuestaResponse>(response);
  }

  async getTotalContactos(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/conversaciones/total-contactos`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    const result = await this.handleResponse<string>(response);
    return parseInt(result as string, 10);
  }

  // =====================================
  // MÉTODOS AUXILIARES
  // =====================================

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  // Limpiar token al cerrar sesión
  clearAuth(): void {
    localStorage.removeItem('jwt_token');
  }
}

// Exportar una instancia singleton
export const backendApi = new BackendApiService();
export default backendApi;