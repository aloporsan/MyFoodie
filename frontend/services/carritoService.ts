import { apiClient } from './apiClient';

export const UNIDADES_CARRITO = [
  'unidades', 'kg', 'g', 'litros', 'ml', 'packs', 'latas', 'bolsas',
  'cucharada', 'cucharadita', 'taza',
];

export type PrioridadCarrito = 'alta' | 'media' | 'baja';

export type EstadoItemCarrito = 'pendiente' | 'aceptado' | 'rechazado' | 'comprado';

export type EstadoListaCompra = 'activa' | 'completada' | 'archivada';

export interface ItemCarrito {
  id: string;
  usuarioId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria?: string | null;
  prioridad: PrioridadCarrito;
  motivo?: string | null;
  estado: EstadoItemCarrito;
  noVolver: boolean;
  recetaId?: string | null;
  recetaTitulo?: string | null;
  productoEnDespensa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarritoResumen {
  totalItems: number;
  itemsAlta: number;
  itemsMedia: number;
  itemsBaja: number;
  itemsAceptados: number;
}

export interface Carrito {
  items: ItemCarrito[];
  resumen: CarritoResumen;
}

export interface ItemCarritoInput {
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria?: string;
}

export interface ItemCompradoAjuste {
  itemId: string;
  cantidad?: number;
  unidad?: string;
  fechaCaducidad?: string;
}

export interface ListaCompra {
  id: string;
  nombre: string;
  items: ItemCarrito[];
  estado: EstadoListaCompra;
  createdAt: string;
  updatedAt: string;
}

export const carritoService = {
  obtenerCarrito: async (): Promise<Carrito> => {
    const { data } = await apiClient.get<Carrito>('/carrito');
    return data;
  },

  generarCarrito: async (): Promise<Carrito> => {
    const { data } = await apiClient.post<Carrito>('/carrito/generar');
    return data;
  },

  aceptarItem: async (id: string): Promise<ItemCarrito> => {
    const { data } = await apiClient.put<ItemCarrito>(`/carrito/items/${id}/aceptar`);
    return data;
  },

  rechazarItem: async (id: string): Promise<ItemCarrito> => {
    const { data } = await apiClient.put<ItemCarrito>(`/carrito/items/${id}/rechazar`);
    return data;
  },

  marcarNoVolver: async (id: string): Promise<ItemCarrito> => {
    const { data } = await apiClient.put<ItemCarrito>(`/carrito/items/${id}/no-volver`);
    return data;
  },

  recuperarItem: async (id: string): Promise<ItemCarrito> => {
    const { data } = await apiClient.put<ItemCarrito>(`/carrito/items/${id}/recuperar`);
    return data;
  },

  modificarCantidad: async (id: string, cantidad: number, unidad?: string): Promise<ItemCarrito> => {
    const { data } = await apiClient.put<ItemCarrito>(`/carrito/items/${id}/cantidad`, {
      cantidad,
      unidad,
    });
    return data;
  },

  añadirItemManual: async (datos: ItemCarritoInput): Promise<ItemCarrito> => {
    const { data } = await apiClient.post<ItemCarrito>('/carrito/items', datos);
    return data;
  },

  eliminarItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/carrito/items/${id}`);
  },

  generarListaCompra: async (nombre?: string): Promise<ListaCompra> => {
    const { data } = await apiClient.post<ListaCompra>('/carrito/lista', nombre ? { nombre } : {});
    return data;
  },

  obtenerListas: async (): Promise<ListaCompra[]> => {
    const { data } = await apiClient.get<ListaCompra[]>('/carrito/listas');
    return data;
  },

  obtenerLista: async (id: string): Promise<ListaCompra> => {
    const { data } = await apiClient.get<ListaCompra>(`/carrito/listas/${id}`);
    return data;
  },

  cancelarLista: async (id: string): Promise<void> => {
    await apiClient.put(`/carrito/listas/${id}/cancelar`);
  },

  obtenerListaActiva: async (): Promise<ListaCompra | null> => {
    const { data, status } = await apiClient.get<ListaCompra | null>('/carrito/listas/activa', {
      validateStatus: (s) => s === 200 || s === 204,
    });
    return status === 204 ? null : data;
  },

  marcarComprado: async (listaId: string, itemId: string): Promise<ItemCarrito> => {
    const { data } = await apiClient.put<ItemCarrito>(
      `/carrito/listas/${listaId}/items/${itemId}/comprado`
    );
    return data;
  },

  añadirCompradosADespensa: async (
    listaId: string,
    ajustes?: ItemCompradoAjuste[]
  ): Promise<ListaCompra> => {
    const { data } = await apiClient.post<ListaCompra>(
      `/carrito/listas/${listaId}/añadir-despensa`,
      ajustes ?? []
    );
    return data;
  },
};
