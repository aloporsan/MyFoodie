import { apiClient } from './apiClient';
import { Receta } from './recetaService';

export interface EmisorCompartir {
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
}

export interface RecetaCompartida {
  id: string;
  emisor: EmisorCompartir;
  receta: Receta;
  mensaje: string | null;
  leida: boolean;
  createdAt: string;
}

export interface IngredienteFaltante {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export const compartirService = {
  compartirReceta: async (
    recetaId: string,
    receptorIds: string[],
    mensaje?: string
  ): Promise<RecetaCompartida[]> => {
    const { data } = await apiClient.post<RecetaCompartida[]>(`/compartir/recetas/${recetaId}`, {
      receptorIds,
      mensaje,
    });
    return data;
  },

  obtenerRecibidas: async (): Promise<RecetaCompartida[]> => {
    const { data } = await apiClient.get<RecetaCompartida[]>('/compartir/recibidas');
    return data;
  },

  marcarComoLeida: async (id: string): Promise<void> => {
    await apiClient.put(`/compartir/recibidas/${id}/leer`);
  },

  guardarRecetaCompartida: async (id: string): Promise<void> => {
    await apiClient.post(`/compartir/recibidas/${id}/guardar`);
  },

  obtenerContador: async (): Promise<number> => {
    const { data } = await apiClient.get<{ noLeidas: number }>('/compartir/recibidas/contador');
    return data.noLeidas;
  },

  obtenerIngredientesFaltantes: async (id: string): Promise<IngredienteFaltante[]> => {
    const { data } = await apiClient.get<IngredienteFaltante[]>(
      `/compartir/recibidas/${id}/ingredientes`
    );
    return data;
  },
};
