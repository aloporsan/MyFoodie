import { apiClient } from './apiClient';

export interface Perfil {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  fotoPerfil: string | null;
  biografia: string | null;
  fechaRegistro: string;
}

export interface PerfilUpdate {
  nombre?: string;
  nombreUsuario?: string;
  fotoPerfil?: string;
  biografia?: string;
}

export interface Preferencias {
  tipoDieta: string | null;
  alergias: string[] | null;
  ingredientesNoDeseados: string[] | null;
  nivelDificultad: string | null;
  tiempoCoccionMax: number | null;
  stockMinimoGlobal?: number | null;
}

export interface PrivacidadUpdate {
  perfilPublico?: boolean;
  mostrarRecetas?: boolean;
  mostrarEstadisticas?: boolean;
  permitirMensajes?: boolean;
}

export interface EstadisticasPerfil {
  totalProductosRegistrados: number;
  totalProductosConsumidos: number;
  totalProductosCaducados: number;
  totalRecetasPublicadas: number;
  totalRecetasGuardadas: number;
  fechaRegistro: string;
}

export const perfilService = {
  obtenerPerfil: async (): Promise<Perfil> => {
    const { data } = await apiClient.get<Perfil>('/perfil');
    return data;
  },

  editarPerfil: async (datos: PerfilUpdate): Promise<Perfil> => {
    const { data } = await apiClient.put<Perfil>('/perfil', datos);
    return data;
  },

  obtenerPreferencias: async (): Promise<Preferencias> => {
    const { data } = await apiClient.get<Preferencias>('/perfil/preferencias');
    return data;
  },

  actualizarPreferencias: async (datos: Partial<Preferencias>): Promise<Preferencias> => {
    const { data } = await apiClient.put<Preferencias>('/perfil/preferencias', datos);
    return data;
  },

  actualizarPrivacidad: async (datos: PrivacidadUpdate): Promise<void> => {
    await apiClient.put('/perfil/privacidad', datos);
  },

  obtenerEstadisticas: async (): Promise<EstadisticasPerfil> => {
    const { data } = await apiClient.get<EstadisticasPerfil>('/perfil/estadisticas');
    return data;
  },

  cerrarSesion: async (): Promise<void> => {
    await apiClient.post('/perfil/cerrar-sesion');
  },

  eliminarCuenta: async (): Promise<void> => {
    await apiClient.delete('/perfil', { data: { confirmar: true } });
  },
};
