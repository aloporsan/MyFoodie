import { apiClient } from './apiClient';
import { Producto } from './despensaService';

export type TipoMatch = 'AUTOMATICO' | 'PROPONER' | 'NUEVO';

export interface ParDuplicado {
  productoA: Producto;
  productoB: Producto;
  similitud: number;
  sugerencia: string;
}

export interface MatchProducto {
  producto: Producto;
  similitud: number;
  tipoMatch: TipoMatch;
  textoSugerido: string;
}

export const matchingService = {
  buscarSimilares: async (nombre: string): Promise<MatchProducto[]> => {
    const { data } = await apiClient.get<MatchProducto[]>('/despensa/productos/similares', {
      params: { nombre },
    });
    return data;
  },

  obtenerDuplicados: async (): Promise<ParDuplicado[]> => {
    const { data } = await apiClient.get<ParDuplicado[]>('/despensa/productos/duplicados');
    return data;
  },

  fusionarProductos: async (
    productoMantenerId: string,
    productoEliminarId: string,
    unidadElegida?: string,
    fechaCaducidadElegida?: string
  ): Promise<Producto> => {
    const { data } = await apiClient.post<Producto>('/despensa/productos/fusionar', {
      productoMantenerId,
      productoEliminarId,
      unidadElegida,
      fechaCaducidadElegida,
    });
    return data;
  },

  ignorarFusion: async (productoAId: string, productoBId: string): Promise<void> => {
    await apiClient.post('/despensa/productos/ignorar-fusion', { productoAId, productoBId });
  },
};
