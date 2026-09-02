import { apiClient } from './apiClient';
import { Receta } from './recetaService';

export type OrigenCompra = 'lista' | 'ticket';

export interface HistorialCompra {
  id: string;
  origen: OrigenCompra;
  titulo: string;
  /** Fecha ISO (YYYY-MM-DD) */
  fecha: string;
  numeroItems: number;
  items: string[];
}

export interface RangoFechas {
  fechaDesde?: string;
  fechaHasta?: string;
}

export type TipoHistorialReceta = 'guardadas' | 'like' | 'comentadas' | 'vistas';

export const historialService = {
  obtenerHistorialCompras: async (rango: RangoFechas = {}): Promise<HistorialCompra[]> => {
    const { data } = await apiClient.get<HistorialCompra[]>('/historial/compras', {
      params: {
        fechaDesde: rango.fechaDesde || undefined,
        fechaHasta: rango.fechaHasta || undefined,
      },
    });
    return data;
  },

  obtenerHistorialRecetas: async (tipo: TipoHistorialReceta): Promise<Receta[]> => {
    const { data } = await apiClient.get<Receta[]>('/perfil/historial-recetas', {
      params: { tipo },
    });
    return data;
  },
};
