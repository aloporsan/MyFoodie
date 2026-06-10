import { create } from 'zustand';
import {
  EstadisticasPerfil,
  Perfil,
  PerfilUpdate,
  Preferencias,
  PrivacidadUpdate,
  perfilService,
} from '@/services/perfilService';
import { handleApiError } from '@/utils/errorHandler';

interface PerfilState {
  perfil: Perfil | null;
  preferencias: Preferencias | null;
  estadisticas: EstadisticasPerfil | null;
  isLoading: boolean;
  error: string | null;
}

interface PerfilActions {
  cargarPerfil: () => Promise<void>;
  editarPerfil: (datos: PerfilUpdate) => Promise<void>;
  actualizarPreferencias: (datos: Partial<Preferencias>) => Promise<void>;
  actualizarPrivacidad: (datos: PrivacidadUpdate) => Promise<void>;
  cargarEstadisticas: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
  eliminarCuenta: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const usePerfilStore = create<PerfilState & PerfilActions>()((set) => ({
  perfil: null,
  preferencias: null,
  estadisticas: null,
  isLoading: false,
  error: null,

  cargarPerfil: async () => {
    set({ isLoading: true, error: null });
    try {
      const [perfil, preferencias] = await Promise.all([
        perfilService.obtenerPerfil(),
        perfilService.obtenerPreferencias(),
      ]);
      set({ perfil, preferencias, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  editarPerfil: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      const perfil = await perfilService.editarPerfil(datos);
      set({ perfil, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  actualizarPreferencias: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      const preferencias = await perfilService.actualizarPreferencias(datos);
      set({ preferencias, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  actualizarPrivacidad: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      await perfilService.actualizarPrivacidad(datos);
      set({ isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  cargarEstadisticas: async () => {
    set({ isLoading: true, error: null });
    try {
      const estadisticas = await perfilService.obtenerEstadisticas();
      set({ estadisticas, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  cerrarSesion: async () => {
    try {
      await perfilService.cerrarSesion();
    } catch {
      // El token se invalida en servidor; continuar con cierre local aunque falle
    }
  },

  eliminarCuenta: async () => {
    set({ isLoading: true, error: null });
    try {
      await perfilService.eliminarCuenta();
      set({ perfil: null, preferencias: null, estadisticas: null, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({ perfil: null, preferencias: null, estadisticas: null, isLoading: false, error: null }),
}));
