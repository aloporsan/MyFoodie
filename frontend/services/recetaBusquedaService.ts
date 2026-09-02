import { apiClient } from './apiClient';
import { Receta } from './recetaService';

/**
 * Búsqueda de recetas publicadas por texto libre (nombre, ingrediente o etiqueta).
 * RF-FEED-017.
 */
export const recetaBusquedaService = {
  buscarRecetas: async (texto: string): Promise<Receta[]> => {
    const q = texto.trim();
    if (!q) return [];
    const { data } = await apiClient.get<Receta[]>('/recetas/buscar', { params: { q } });
    return data;
  },
};
