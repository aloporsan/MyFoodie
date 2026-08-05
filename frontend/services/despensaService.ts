import { apiClient } from './apiClient';

export type EstadoProducto =
  | 'normal'
  | 'bajoStock'
  | 'sin_stock'
  | 'caducado'
  | 'caduca_hoy'
  | 'caduca_pronto'
  | 'caduca_semana'
  | 'caduca_mes';

export interface Producto {
  id: string;
  despensaId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria?: string;
  fechaCaducidad?: string;
  fechaCompra?: string;
  marca?: string;
  notas?: string;
  stockMinimo?: number;
  alertaCompra?: boolean;
  estado: EstadoProducto;
  diasHastaCaducidad?: number | null;
  posiblesDuplicados?: Producto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductoInput {
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria?: string;
  fechaCaducidad?: string;
  fechaCompra?: string;
  marca?: string;
  notas?: string;
  stockMinimo?: number;
}

export interface ProductoFiltro {
  categoria?: string;
  estado?: EstadoProducto | '';
  caducaAntesDe?: string;
}

export type MotivoEliminacion =
  | 'consumido'
  | 'caducado'
  | 'usado_en_receta'
  | 'donado'
  | 'perdido'
  | 'otro';

export interface MovimientoProducto {
  id: string;
  tipo: 'añadido' | 'editado' | 'cantidad_actualizada' | 'eliminado';
  descripcion: string;
  cantidadAnterior?: number | null;
  cantidadNueva?: number | null;
  motivo?: MotivoEliminacion | null;
  motivoDetalle?: string | null;
  createdAt: string;
}

export const despensaService = {
  listarProductos: async (orderBy?: string): Promise<Producto[]> => {
    const { data } = orderBy
      ? await apiClient.get<Producto[]>('/despensa/productos', { params: { orderBy } })
      : await apiClient.get<Producto[]>('/despensa/productos');
    return data;
  },

  obtenerProducto: async (id: string): Promise<Producto> => {
    const { data } = await apiClient.get<Producto>(`/despensa/productos/${id}`);
    return data;
  },

  añadirProducto: async (datos: ProductoInput): Promise<Producto> => {
    const { data } = await apiClient.post<Producto>('/despensa/productos', datos);
    return data;
  },

  editarProducto: async (id: string, datos: ProductoInput): Promise<Producto> => {
    const { data } = await apiClient.put<Producto>(`/despensa/productos/${id}`, datos);
    return data;
  },

  eliminarProducto: async (
    id: string,
    motivo?: MotivoEliminacion,
    motivoDetalle?: string
  ): Promise<void> => {
    const body = motivo ? { motivo, motivoDetalle } : undefined;
    await apiClient.delete(`/despensa/productos/${id}`, { data: body });
  },

  obtenerHistorial: async (id: string): Promise<MovimientoProducto[]> => {
    const { data } = await apiClient.get<MovimientoProducto[]>(
      `/despensa/productos/${id}/historial`
    );
    return data;
  },

  actualizarCantidad: async (
    id: string,
    delta: number,
    motivo?: MotivoEliminacion,
    motivoDetalle?: string
  ): Promise<Producto> => {
    const { data } = await apiClient.patch<Producto>(`/despensa/productos/${id}/cantidad`, {
      delta,
      motivo,
      motivoDetalle,
    });
    return data;
  },

  buscarProductos: async (texto: string): Promise<Producto[]> => {
    const { data } = await apiClient.get<Producto[]>('/despensa/productos/buscar', {
      params: { q: texto },
    });
    return data;
  },

  filtrarProductos: async (filtros: ProductoFiltro): Promise<Producto[]> => {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== undefined && v !== '')
    );
    const { data } = await apiClient.get<Producto[]>('/despensa/productos/filtrar', { params });
    return data;
  },
};
