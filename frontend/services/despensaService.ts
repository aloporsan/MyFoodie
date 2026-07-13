import { apiClient } from './apiClient';

export type EstadoProducto = 'normal' | 'bajoStock' | 'proximoCaducar' | 'caducado';

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

export const despensaService = {
  listarProductos: async (): Promise<Producto[]> => {
    const { data } = await apiClient.get<Producto[]>('/despensa/productos');
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

  eliminarProducto: async (id: string): Promise<void> => {
    await apiClient.delete(`/despensa/productos/${id}`);
  },

  actualizarCantidad: async (id: string, delta: number): Promise<Producto> => {
    const { data } = await apiClient.patch<Producto>(`/despensa/productos/${id}/cantidad`, { delta });
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
