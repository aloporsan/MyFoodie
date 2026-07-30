import { apiClient } from './apiClient';

export interface Seguimiento {
  id: string;
  usuarioId: string;
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
  estado: 'pendiente' | 'aceptado';
  fechaSeguimiento: string;
}

export interface PerfilPublico {
  id: string;
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
  biografia: string | null;
  numSeguidores: number;
  numSeguidos: number;
  numRecetas: number;
  esSeguido: boolean;
  haSolicitado: boolean;
  estaBloqueado: boolean;
  privacidad: 'PUBLICA' | 'PRIVADA';
}

export interface UsuarioBusqueda {
  id: string;
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
  numRecetas: number;
  esSeguido: boolean;
  haSolicitado: boolean;
}

export const socialService = {
  seguirUsuario: async (usuarioId: string): Promise<Seguimiento> => {
    const { data } = await apiClient.post<Seguimiento>(`/social/seguir/${usuarioId}`);
    return data;
  },

  dejarDeSeguir: async (usuarioId: string): Promise<void> => {
    await apiClient.delete(`/social/seguir/${usuarioId}`);
  },

  aceptarSolicitud: async (seguidorId: string): Promise<Seguimiento> => {
    const { data } = await apiClient.post<Seguimiento>(`/social/solicitudes/${seguidorId}/aceptar`);
    return data;
  },

  rechazarSolicitud: async (seguidorId: string): Promise<void> => {
    await apiClient.post(`/social/solicitudes/${seguidorId}/rechazar`);
  },

  obtenerSeguidores: async (usuarioId?: string): Promise<Seguimiento[]> => {
    const url = usuarioId ? `/social/seguidores/${usuarioId}` : '/social/seguidores';
    const { data } = await apiClient.get<Seguimiento[]>(url);
    return data;
  },

  obtenerSeguidos: async (usuarioId?: string): Promise<Seguimiento[]> => {
    const url = usuarioId ? `/social/seguidos/${usuarioId}` : '/social/seguidos';
    const { data } = await apiClient.get<Seguimiento[]>(url);
    return data;
  },

  obtenerSolicitudes: async (): Promise<Seguimiento[]> => {
    const { data } = await apiClient.get<Seguimiento[]>('/social/solicitudes');
    return data;
  },

  obtenerPerfilPublico: async (usuarioId: string): Promise<PerfilPublico> => {
    const { data } = await apiClient.get<PerfilPublico>(`/social/perfil/${usuarioId}`);
    return data;
  },

  buscarUsuarios: async (texto: string): Promise<UsuarioBusqueda[]> => {
    const { data } = await apiClient.get<UsuarioBusqueda[]>('/social/buscar', {
      params: { q: texto },
    });
    return data;
  },

  bloquearUsuario: async (usuarioId: string): Promise<void> => {
    await apiClient.post(`/social/bloquear/${usuarioId}`);
  },

  desbloquearUsuario: async (usuarioId: string): Promise<void> => {
    await apiClient.delete(`/social/bloquear/${usuarioId}`);
  },

  obtenerBloqueados: async (): Promise<UsuarioBusqueda[]> => {
    const { data } = await apiClient.get<UsuarioBusqueda[]>('/social/bloqueados');
    return data;
  },
};
