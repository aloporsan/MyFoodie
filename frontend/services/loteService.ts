import { apiClient } from './apiClient';

export type OrigenLote = 'manual' | 'ocr' | 'carrito' | 'receta';

export type CriterioFechaLote = 'MAS_TEMPRANA' | 'MAS_TARDIA';

export type EstadoLote =
  | 'normal'
  | 'sin_stock'
  | 'caducado'
  | 'caduca_hoy'
  | 'caduca_pronto'
  | 'caduca_semana'
  | 'caduca_mes';

export interface LoteProducto {
  id: string;
  cantidad: number;
  unidad: string;
  fechaCaducidad?: string;
  fechaCompra?: string;
  origen: OrigenLote;
  diasHastaCaducidad?: number | null;
  estado: EstadoLote;
  createdAt: string;
}

export interface LoteProductoInput {
  cantidad: number;
  unidad: string;
  fechaCaducidad?: string;
  fechaCompra?: string;
  origen?: OrigenLote;
}

export const loteService = {
  listar: async (productoId: string): Promise<LoteProducto[]> => {
    const { data } = await apiClient.get<LoteProducto[]>(`/despensa/productos/${productoId}/lotes`);
    return data;
  },

  añadir: async (productoId: string, datos: LoteProductoInput): Promise<LoteProducto> => {
    const { data } = await apiClient.post<LoteProducto>(`/despensa/productos/${productoId}/lotes`, datos);
    return data;
  },

  editar: async (productoId: string, loteId: string, datos: LoteProductoInput): Promise<LoteProducto> => {
    const { data } = await apiClient.put<LoteProducto>(
      `/despensa/productos/${productoId}/lotes/${loteId}`,
      datos
    );
    return data;
  },

  eliminar: async (productoId: string, loteId: string): Promise<void> => {
    await apiClient.delete(`/despensa/productos/${productoId}/lotes/${loteId}`);
  },

  compactar: async (productoId: string, criterioFecha: CriterioFechaLote): Promise<LoteProducto> => {
    const { data } = await apiClient.post<LoteProducto>(`/despensa/productos/${productoId}/lotes/compactar`, {
      criterioFecha,
    });
    return data;
  },
};
