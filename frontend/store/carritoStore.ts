import { create } from 'zustand';
import {
  Carrito,
  CarritoResumen,
  ItemCarrito,
  ItemCarritoInput,
  ItemCompradoAjuste,
  ListaCompra,
  carritoService,
} from '@/services/carritoService';
import { handleApiError } from '@/utils/errorHandler';

interface CarritoState {
  items: ItemCarrito[];
  resumen: CarritoResumen | null;
  listas: ListaCompra[];
  listaActiva: ListaCompra | null;
  listaEnCurso: ListaCompra | null;
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
  recuperarItem: (id: string) => Promise<void>;
  modificarCantidad: (id: string, cantidad: number) => Promise<void>;
  añadirItemManual: (datos: ItemCarritoInput) => Promise<void>;
  eliminarItem: (id: string) => Promise<void>;
  generarListaCompra: (nombre?: string) => Promise<ListaCompra>;
  cargarListas: () => Promise<void>;
  cargarLista: (id: string) => Promise<void>;
  cargarListaEnCurso: () => Promise<void>;
  alternarComprado: (listaId: string, itemId: string) => Promise<void>;
  añadirCompradosADespensa: (listaId: string, ajustes?: ItemCompradoAjuste[]) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ESTADO_INICIAL: CarritoState = {
  items: [],
  resumen: null,
  listas: [],
  listaActiva: null,
  listaEnCurso: null,
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

const actualizarItemEnListas = (listas: ListaCompra[], item: ItemCarrito): ListaCompra[] =>
  listas.map((l) =>
    l.items.some((i) => i.id === item.id)
      ? { ...l, items: l.items.map((i) => (i.id === item.id ? item : i)) }
      : l
  );

const quitarItemDeListas = (listas: ListaCompra[], itemId: string): ListaCompra[] =>
  listas.map((l) => ({ ...l, items: l.items.filter((i) => i.id !== itemId) }));

const actualizarItemEnListaCompra = (lista: ListaCompra | null, item: ItemCarrito): ListaCompra | null =>
  lista && lista.items.some((i) => i.id === item.id)
    ? { ...lista, items: lista.items.map((i) => (i.id === item.id ? item : i)) }
    : lista;

const quitarItemDeListaCompra = (lista: ListaCompra | null, itemId: string): ListaCompra | null =>
  lista ? { ...lista, items: lista.items.filter((i) => i.id !== itemId) } : lista;

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

  recuperarItem: async (id) => {
    set({ error: null });
    try {
      const actualizado = await carritoService.recuperarItem(id);
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
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? actualizado : i)),
        listas: actualizarItemEnListas(s.listas, actualizado),
        listaActiva: actualizarItemEnListaCompra(s.listaActiva, actualizado),
        listaEnCurso: actualizarItemEnListaCompra(s.listaEnCurso, actualizado),
      }));
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
        return {
          items,
          resumen: calcularResumen(items),
          listas: quitarItemDeListas(s.listas, id),
          listaActiva: quitarItemDeListaCompra(s.listaActiva, id),
          listaEnCurso: quitarItemDeListaCompra(s.listaEnCurso, id),
        };
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
      set((s) => ({ listas: [lista, ...s.listas], listaActiva: lista, listaEnCurso: lista }));
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

  cargarListaEnCurso: async () => {
    try {
      const listaEnCurso = await carritoService.obtenerListaActiva();
      set({ listaEnCurso });
    } catch (e) {
      set({ error: handleApiError(e) });
    }
  },

  alternarComprado: async (listaId, itemId) => {
    const listaActual = get().listaActiva;
    const itemActual = listaActual?.items.find((i) => i.id === itemId);
    if (!listaActual || listaActual.id !== listaId || !itemActual) return;

    const estadoAnterior = itemActual.estado;
    const marcarComoComprado = estadoAnterior !== 'comprado';
    const estadoOptimista = marcarComoComprado ? 'comprado' : 'aceptado';

    // Actualización optimista: refleja el cambio al instante, sin esperar la red.
    set((s) => ({
      error: null,
      listaActiva: s.listaActiva && s.listaActiva.id === listaId
        ? {
            ...s.listaActiva,
            items: s.listaActiva.items.map((i) =>
              i.id === itemId ? { ...i, estado: estadoOptimista } : i
            ),
          }
        : s.listaActiva,
    }));

    try {
      const actualizado = marcarComoComprado
        ? await carritoService.marcarComprado(listaId, itemId)
        : await carritoService.aceptarItem(itemId);

      set((s) => ({
        listas: actualizarItemEnListas(s.listas, actualizado),
        listaActiva: actualizarItemEnListaCompra(s.listaActiva, actualizado),
        listaEnCurso: actualizarItemEnListaCompra(s.listaEnCurso, actualizado),
        items: marcarComoComprado
          ? s.items.filter((i) => i.id !== itemId)
          : s.items.some((i) => i.id === itemId)
            ? s.items.map((i) => (i.id === itemId ? actualizado : i))
            : [...s.items, actualizado],
      }));
    } catch (e) {
      // Revierte la actualización optimista si la petición falla.
      set((s) => ({
        error: handleApiError(e),
        listaActiva: s.listaActiva && s.listaActiva.id === listaId
          ? {
              ...s.listaActiva,
              items: s.listaActiva.items.map((i) =>
                i.id === itemId ? { ...i, estado: estadoAnterior } : i
              ),
            }
          : s.listaActiva,
      }));
      throw e;
    }
  },

  añadirCompradosADespensa: async (listaId, ajustes) => {
    set({ error: null });
    try {
      const lista = await carritoService.añadirCompradosADespensa(listaId, ajustes);
      set((s) => ({
        listas: s.listas.map((l) => (l.id === listaId ? lista : l)),
        listaActiva: s.listaActiva && s.listaActiva.id === listaId ? lista : s.listaActiva,
        listaEnCurso: s.listaEnCurso && s.listaEnCurso.id === listaId ? null : s.listaEnCurso,
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...ESTADO_INICIAL }),
}));
