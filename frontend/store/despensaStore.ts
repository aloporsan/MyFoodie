import { create } from 'zustand';
import {
  despensaService,
  Producto,
  ProductoFiltro,
  ProductoInput,
} from '@/services/despensaService';
import { handleApiError } from '@/utils/errorHandler';

const FILTRO_VACIO: ProductoFiltro = {};

interface DespensaState {
  productos: Producto[];
  isLoading: boolean;
  error: string | null;
  filtrosActivos: ProductoFiltro;
  busquedaActiva: string;
}

interface DespensaActions {
  cargarProductos: () => Promise<void>;
  añadirProducto: (datos: ProductoInput) => Promise<Producto>;
  editarProducto: (id: string, datos: ProductoInput) => Promise<void>;
  eliminarProducto: (id: string) => Promise<void>;
  actualizarCantidad: (id: string, delta: number) => Promise<void>;
  setBusqueda: (texto: string) => void;
  setFiltros: (filtros: ProductoFiltro) => void;
  limpiarFiltros: () => void;
  clearError: () => void;
}

const hayFiltrosActivos = (f: ProductoFiltro): boolean =>
  Object.values(f).some((v) => v !== undefined && v !== '');

export const useDespensaStore = create<DespensaState & DespensaActions>()((set, get) => ({
  productos: [],
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
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  eliminarProducto: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await despensaService.eliminarProducto(id);
      set((s) => ({
        productos: s.productos.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  actualizarCantidad: async (id, delta) => {
    try {
      const actualizado = await despensaService.actualizarCantidad(id, delta);
      set((s) => ({
        productos: s.productos.map((p) => (p.id === id ? actualizado : p)),
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  setBusqueda: (texto) => set({ busquedaActiva: texto }),

  setFiltros: (filtros) => set({ filtrosActivos: filtros }),

  limpiarFiltros: () => set({ filtrosActivos: FILTRO_VACIO, busquedaActiva: '' }),

  clearError: () => set({ error: null }),
}));
