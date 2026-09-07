import { apiClient } from './apiClient';

export interface DashboardResumen {
  totalProductos: number;
  sinStock: number;
  caducados: number;
  caduca_pronto: number;
  caduca_semana: number;
  caduca_mes: number;
  bajoStock: number;
}

export interface AlertaCaducidad {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  fechaCaducidad: string | null;
  estado: 'caducado' | 'caduca_hoy' | 'caduca_pronto' | 'caduca_semana' | 'caduca_mes';
  diasParaCaducar: number;
}

export interface ProductoPrioritario {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  estado: string;
  motivo: string;
}

export interface Estadisticas {
  totalRegistrados: number;
  consumidos: number;
  caducadosHistorico: number;
  categoriaLider: string;
  aprovechamiento: number;
}

export interface CarritoResumen {
  disponible: boolean;
  productosRecomendados: number;
  sugeridos: string[];
}

export interface Dashboard {
  resumen: DashboardResumen;
  alertas: AlertaCaducidad[];
  prioritarios: ProductoPrioritario[];
  estadisticas: Estadisticas;
  carrito: CarritoResumen;
}

export const dashboardService = {
  obtenerDashboard: async (): Promise<Dashboard> => {
    const { data } = await apiClient.get<Dashboard>('/dashboard');
    return data;
  },

  obtenerAlertas: async (): Promise<AlertaCaducidad[]> => {
    const { data } = await apiClient.get<AlertaCaducidad[]>('/dashboard/alertas');
    return data;
  },

  obtenerPrioritarios: async (): Promise<ProductoPrioritario[]> => {
    const { data } = await apiClient.get<ProductoPrioritario[]>('/dashboard/prioritarios');
    return data;
  },

  obtenerEstadisticas: async (): Promise<Estadisticas> => {
    const { data } = await apiClient.get<Estadisticas>('/dashboard/estadisticas');
    return data;
  },
};
