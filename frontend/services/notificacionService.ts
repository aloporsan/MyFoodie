import { apiClient } from './apiClient';

export const notificacionService = {
  obtenerContador: async (): Promise<number> => {
    const { data } = await apiClient.get<{ noLeidas: number }>('/notificaciones/contador');
    return data.noLeidas;
  },
};
