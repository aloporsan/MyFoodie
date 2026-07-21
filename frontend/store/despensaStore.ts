import { create } from 'zustand';
import {
  despensaService,
  MovimientoProducto,
  MotivoEliminacion,
  Producto,
  ProductoFiltro,
  ProductoInput,
} from '@/services/despensaService';
import { handleApiError } from '@/utils/errorHandler';
import { useDashboardStore } from './dashboardStore';

const FILTRO_VACIO: ProductoFiltro = {};

interface DespensaState {
  productos: Producto[];
  historialProducto: MovimientoProducto[];
  isLoading: boolean;
  error: string | null;
  filtrosActivos: ProductoFiltro;
  busquedaActiva: string;
}

interface DespensaActions {
  cargarProductos: () => Promise<void>;
  añadirProducto: (datos: ProductoInput) => Promise<Producto>;
  editarProducto: (id: string, datos: ProductoInput) => Promise<void>;
  eliminarProducto: (id: string, motivo?: MotivoEliminacion, motivoDetalle?: string) => Promise<void>;
  actualizarCantidad: (id: string, delta: number, motivo?: MotivoEliminacion, motivoDetalle?: string) => Promise<void>;
  cargarHistorial: (productoId: string) => Promise<void>;
  setBusqueda: (texto: string) => void;
  setFiltros: (filtros: ProductoFiltro) => void;
  limpiarFiltros: () => void;
  clearError: () => void;
}

const hayFiltrosActivos = (f: ProductoFiltro): boolean =>
  Object.values(f).some((v) => v !== undefined && v !== '');

export const useDespensaStore = create<DespensaState & DespensaActions>()((set, get) => ({
  productos: [],
  historialProducto: [],
  isLoading: false,
  error: null,
  filtrosActivos: FILTRO_VACIO,
  busquedaActiva: '',

  cargarProductos: async () => {
    set({ isLoading: true, error: null });
    try {
      const { busquedaActiva, filtrosActivos } = get();
      let productos: Producto[];

      if (busquedaActiva.trim()) {
        productos = await despensaService.buscarProductos(busquedaActiva.trim());
      } else if (hayFiltrosActivos(filtrosActivos)) {
        productos = await despensaService.filtrarProductos(filtrosActivos);
      } else {
        productos = await despensaService.listarProductos();
      }

      set({ productos, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  añadirProducto: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      const nuevo = await despensaService.añadirProducto(datos);
      set((s) => ({ productos: [...s.productos, nuevo], isLoading: false }));
      useDashboardStore.getState().cargarDashboard();
      return nuevo;
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  editarProducto: async (id, datos) => {
    set({ isLoading: true, error: null });
    try {
      const actualizado = await despensaService.editarProducto(id, datos);
      set((s) => ({
        productos: s.productos.map((p) => (p.id === id ? actualizado : p)),
        isLoading: false,
      }));
      useDashboardStore.getState().cargarDashboard();
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  eliminarProducto: async (id, motivo, motivoDetalle) => {
    set({ isLoading: true, error: null });
    try {
      await despensaService.eliminarProducto(id, motivo, motivoDetalle);
      set((s) => ({
        productos: s.productos.filter((p) => p.id !== id),
        isLoading: false,
      }));
      useDashboardStore.getState().cargarDashboard();
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  actualizarCantidad: async (id, delta, motivo, motivoDetalle) => {
    try {
      const actualizado = await despensaService.actualizarCantidad(id, delta, motivo, motivoDetalle);
      set((s) => ({
        productos: s.productos.map((p) => (p.id === id ? actualizado : p)),
      }));
      useDashboardStore.getState().cargarDashboard();
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  cargarHistorial: async (productoId) => {
    set({ isLoading: true, error: null });
    try {
      const historial = await despensaService.obtenerHistorial(productoId);
      set({ historialProducto: historial, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  setBusqueda: (texto) => set({ busquedaActiva: texto }),

  setFiltros: (filtros) => set({ filtrosActivos: filtros }),

  limpiarFiltros: () => set({ filtrosActivos: FILTRO_VACIO, busquedaActiva: '' }),

  clearError: () => set({ error: null }),
}));
