import { create } from 'zustand';
import { handleApiError } from '@/utils/errorHandler';
import {
  AlertaCaducidad,
  CarritoResumen,
  Dashboard,
  DashboardResumen,
  Estadisticas,
  ProductoPrioritario,
  RecetaRecomendada,
  dashboardService,
} from '@/services/dashboardService';

interface DashboardState {
  resumen: DashboardResumen | null;
  alertas: AlertaCaducidad[];
  prioritarios: ProductoPrioritario[];
  estadisticas: Estadisticas | null;
  carritoResumen: CarritoResumen | null;
  recetasRecomendadas: RecetaRecomendada | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface DashboardActions {
  cargarDashboard: () => Promise<void>;
  refrescar: () => Promise<void>;
  clearError: () => void;
}

const aplicarDashboard = (dashboard: Dashboard): Partial<DashboardState> => ({
  resumen: dashboard.resumen,
  alertas: dashboard.alertas,
  prioritarios: dashboard.prioritarios,
  estadisticas: dashboard.estadisticas,
  carritoResumen: dashboard.carrito,
  recetasRecomendadas: dashboard.recetas,
  lastUpdated: new Date(),
});

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  (set) => ({
    resumen: null,
    alertas: [],
    prioritarios: [],
    estadisticas: null,
    carritoResumen: null,
    recetasRecomendadas: null,
    isLoading: false,
    error: null,
    lastUpdated: null,

    cargarDashboard: async () => {
      set({ isLoading: true, error: null });
      try {
        const dashboard = await dashboardService.obtenerDashboard();
        set({ ...aplicarDashboard(dashboard), isLoading: false });
      } catch (e) {
        set({ error: handleApiError(e), isLoading: false });
      }
    },

    refrescar: async () => {
      set({ error: null });
      try {
        const dashboard = await dashboardService.obtenerDashboard();
        set(aplicarDashboard(dashboard));
      } catch (e) {
        set({ error: handleApiError(e) });
      }
    },

    clearError: () => set({ error: null }),
  })
);
