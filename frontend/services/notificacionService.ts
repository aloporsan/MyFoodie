import { apiClient } from './apiClient';

export interface EmisorNotificacion {
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
}

export interface Notificacion {
  id: string;
  tipo: string;
  emisor: EmisorNotificacion | null;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  referenciaId: string | null;
  referenciaType: string | null;
  createdAt: string;
}

export interface PreferenciasNotificacion {
  notificarNuevoSeguidor: boolean;
  notificarSolicitudSeguimiento: boolean;
  notificarLikes: boolean;
  notificarComentarios: boolean;
  notificarRecetasCompartidas: boolean;
  notificarCaducidades: boolean;
  notificarCarrito: boolean;
}

export const notificacionService = {
  obtenerNotificaciones: async (pagina = 0, tamaño = 20): Promise<Notificacion[]> => {
    const { data } = await apiClient.get<Notificacion[]>('/notificaciones', {
      params: { pagina, tamaño },
    });
    return data;
  },

  obtenerContador: async (): Promise<number> => {
    const { data } = await apiClient.get<{ noLeidas: number }>('/notificaciones/contador');
    return data.noLeidas;
  },

  marcarComoLeida: async (id: string): Promise<void> => {
    await apiClient.put(`/notificaciones/${id}/leer`);
  },

  marcarTodasComoLeidas: async (): Promise<void> => {
    await apiClient.put('/notificaciones/leer-todas');
  },

  eliminarNotificacion: async (id: string): Promise<void> => {
    await apiClient.delete(`/notificaciones/${id}`);
  },

  registrarPushToken: async (token: string): Promise<void> => {
    await apiClient.post('/usuarios/push-token', { token });
  },

  obtenerPreferencias: async (): Promise<PreferenciasNotificacion> => {
    const { data } = await apiClient.get<PreferenciasNotificacion>('/perfil/notificaciones');
    return data;
  },

  actualizarPreferencias: async (
    datos: Partial<PreferenciasNotificacion>
  ): Promise<PreferenciasNotificacion> => {
    const { data } = await apiClient.put<PreferenciasNotificacion>(
      '/perfil/notificaciones',
      datos
    );
    return data;
  },
};
