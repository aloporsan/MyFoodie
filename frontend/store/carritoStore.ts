import { create } from 'zustand';
import {
  Carrito,
  CarritoResumen,
  ItemCarrito,
  ItemCarritoInput,
  ListaCompra,
  carritoService,
} from '@/services/carritoService';
import { handleApiError } from '@/utils/errorHandler';

interface CarritoState {
  items: ItemCarrito[];
  resumen: CarritoResumen | null;
  listas: ListaCompra[];
  listaActiva: ListaCompra | null;
  isLoading: boolean;
  isGenerando: boolean;
  error: string | null;
}

interface CarritoActions {
  cargarCarrito: () => Promise<void>;
  generarCarrito: () => Promise<void>;
  aceptarItem: (id: string) => Promise<void>;
  rechazarItem: (id: string) => Promise<void>;
  marcarNoVolver: (id: string) => Promise<void>;
  modificarCantidad: (id: string, cantidad: number) => Promise<void>;
  añadirItemManual: (datos: ItemCarritoInput) => Promise<void>;
  eliminarItem: (id: string) => Promise<void>;
  generarListaCompra: (nombre?: string) => Promise<ListaCompra>;
  cargarListas: () => Promise<void>;
  cargarLista: (id: string) => Promise<void>;
  marcarComprado: (listaId: string, itemId: string) => Promise<void>;
  añadirCompradosADespensa: (listaId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ESTADO_INICIAL: CarritoState = {
  items: [],
  resumen: null,
  listas: [],
  listaActiva: null,
  isLoading: false,
  isGenerando: false,
  error: null,
};

const calcularResumen = (items: ItemCarrito[]): CarritoResumen => {
  const pendientes = items.filter((i) => i.estado === 'pendiente');
  return {
    totalItems: pendientes.length,
    itemsAlta: pendientes.filter((i) => i.prioridad === 'alta').length,
    itemsMedia: pendientes.filter((i) => i.prioridad === 'media').length,
    itemsBaja: pendientes.filter((i) => i.prioridad === 'baja').length,
    itemsAceptados: items.filter((i) => i.estado === 'aceptado').length,
  };
};

const actualizarItemEnLista = (listas: ListaCompra[], listaId: string, item: ItemCarrito): ListaCompra[] =>
  listas.map((l) =>
    l.id === listaId
      ? { ...l, items: l.items.map((i) => (i.id === item.id ? item : i)) }
      : l
  );

export const useCarritoStore = create<CarritoState & CarritoActions>()((set, get) => ({
  ...ESTADO_INICIAL,

  cargarCarrito: async () => {
    set({ isLoading: true, error: null });
    try {
      const carrito: Carrito = await carritoService.obtenerCarrito();
      set({ items: carrito.items, resumen: carrito.resumen, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  generarCarrito: async () => {
    set({ isGenerando: true, error: null });
    try {
      const carrito: Carrito = await carritoService.generarCarrito();
      set({ items: carrito.items, resumen: carrito.resumen, isGenerando: false });
    } catch (e) {
      set({ error: handleApiError(e), isGenerando: false });
    }
  },

  aceptarItem: async (id) => {
    set({ error: null });
    try {
      const actualizado = await carritoService.aceptarItem(id);
      set((s) => {
        const items = s.items.map((i) => (i.id === id ? actualizado : i));
        return { items, resumen: calcularResumen(items) };
      });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  rechazarItem: async (id) => {
    set({ error: null });
    try {
      const actualizado = await carritoService.rechazarItem(id);
      set((s) => {
        const items = s.items.map((i) => (i.id === id ? actualizado : i));
        return { items, resumen: calcularResumen(items) };
      });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  marcarNoVolver: async (id) => {
    set({ error: null });
    try {
      const actualizado = await carritoService.marcarNoVolver(id);
      set((s) => {
        const items = s.items.map((i) => (i.id === id ? actualizado : i));
        return { items, resumen: calcularResumen(items) };
      });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  modificarCantidad: async (id, cantidad) => {
    set({ error: null });
    try {
      const actualizado = await carritoService.modificarCantidad(id, cantidad);
      set((s) => ({ items: s.items.map((i) => (i.id === id ? actualizado : i)) }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  añadirItemManual: async (datos) => {
    set({ error: null });
    try {
      const nuevo = await carritoService.añadirItemManual(datos);
      set((s) => {
        const items = [...s.items, nuevo];
        return { items, resumen: calcularResumen(items) };
      });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  eliminarItem: async (id) => {
    set({ error: null });
    try {
      await carritoService.eliminarItem(id);
      set((s) => {
        const items = s.items.filter((i) => i.id !== id);
        return { items, resumen: calcularResumen(items) };
      });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  generarListaCompra: async (nombre) => {
    set({ error: null });
    try {
      const lista = await carritoService.generarListaCompra(nombre);
      set((s) => ({ listas: [lista, ...s.listas], listaActiva: lista }));
      return lista;
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  cargarListas: async () => {
    set({ isLoading: true, error: null });
    try {
      const listas = await carritoService.obtenerListas();
      set({ listas, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  cargarLista: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const listaActiva = await carritoService.obtenerLista(id);
      set({ listaActiva, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  marcarComprado: async (listaId, itemId) => {
    set({ error: null });
    try {
      const actualizado = await carritoService.marcarComprado(listaId, itemId);
      set((s) => ({
        items: s.items.filter((i) => i.id !== itemId),
        listas: actualizarItemEnLista(s.listas, listaId, actualizado),
        listaActiva:
          s.listaActiva && s.listaActiva.id === listaId
            ? { ...s.listaActiva, items: s.listaActiva.items.map((i) => (i.id === itemId ? actualizado : i)) }
            : s.listaActiva,
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  añadirCompradosADespensa: async (listaId) => {
    set({ error: null });
    try {
      const lista = await carritoService.añadirCompradosADespensa(listaId);
      set((s) => ({
        listas: s.listas.map((l) => (l.id === listaId ? lista : l)),
        listaActiva: s.listaActiva && s.listaActiva.id === listaId ? lista : s.listaActiva,
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...ESTADO_INICIAL }),
}));
