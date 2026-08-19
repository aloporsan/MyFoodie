import { create } from 'zustand';
import {
  PerfilPublico,
  Seguimiento,
  UsuarioBusqueda,
  socialService,
} from '@/services/socialService';
import { handleApiError } from '@/utils/errorHandler';

interface SocialState {
  seguidores: Seguimiento[];
  seguidos: Seguimiento[];
  solicitudesPendientes: Seguimiento[];
  bloqueados: UsuarioBusqueda[];
  perfilPublico: PerfilPublico | null;
  resultadosBusqueda: UsuarioBusqueda[];
  isLoading: boolean;
  error: string | null;
}

interface SocialActions {
  seguirUsuario: (usuarioId: string) => Promise<void>;
  dejarDeSeguir: (usuarioId: string) => Promise<void>;
  aceptarSolicitud: (seguidorId: string) => Promise<void>;
  rechazarSolicitud: (seguidorId: string) => Promise<void>;
  cargarSeguidores: (usuarioId?: string) => Promise<void>;
  cargarSeguidos: (usuarioId?: string) => Promise<void>;
  cargarSolicitudes: () => Promise<void>;
  cargarPerfilPublico: (usuarioId: string) => Promise<void>;
  buscarUsuarios: (texto: string, soloCompartibles?: boolean) => Promise<void>;
  bloquearUsuario: (usuarioId: string) => Promise<void>;
  desbloquearUsuario: (usuarioId: string) => Promise<void>;
  cargarBloqueados: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ESTADO_INICIAL: SocialState = {
  seguidores: [],
  seguidos: [],
  solicitudesPendientes: [],
  bloqueados: [],
  perfilPublico: null,
  resultadosBusqueda: [],
  isLoading: false,
  error: null,
};

export const useSocialStore = create<SocialState & SocialActions>()((set, get) => ({
  ...ESTADO_INICIAL,

  seguirUsuario: async (usuarioId) => {
    set({ error: null });
    try {
      const seguimiento = await socialService.seguirUsuario(usuarioId);
      const aceptado = seguimiento.estado === 'aceptado';
      set((s) => ({
        seguidos: aceptado
          ? [...s.seguidos.filter((u) => u.usuarioId !== usuarioId), seguimiento]
          : s.seguidos,
        perfilPublico:
          s.perfilPublico?.id === usuarioId
            ? { ...s.perfilPublico, esSeguido: aceptado, haSolicitado: !aceptado }
            : s.perfilPublico,
        resultadosBusqueda: s.resultadosBusqueda.map((u) =>
          u.id === usuarioId ? { ...u, esSeguido: aceptado, haSolicitado: !aceptado } : u
        ),
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  dejarDeSeguir: async (usuarioId) => {
    set({ error: null });
    try {
      await socialService.dejarDeSeguir(usuarioId);
      set((s) => ({
        seguidos: s.seguidos.filter((u) => u.usuarioId !== usuarioId),
        perfilPublico:
          s.perfilPublico?.id === usuarioId
            ? { ...s.perfilPublico, esSeguido: false, haSolicitado: false }
            : s.perfilPublico,
        resultadosBusqueda: s.resultadosBusqueda.map((u) =>
          u.id === usuarioId ? { ...u, esSeguido: false, haSolicitado: false } : u
        ),
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  aceptarSolicitud: async (seguidorId) => {
    set({ error: null });
    try {
      const seguimiento = await socialService.aceptarSolicitud(seguidorId);
      set((s) => ({
        solicitudesPendientes: s.solicitudesPendientes.filter((u) => u.usuarioId !== seguidorId),
        seguidores: [...s.seguidores.filter((u) => u.usuarioId !== seguidorId), seguimiento],
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  rechazarSolicitud: async (seguidorId) => {
    set({ error: null });
    try {
      await socialService.rechazarSolicitud(seguidorId);
      set((s) => ({
        solicitudesPendientes: s.solicitudesPendientes.filter((u) => u.usuarioId !== seguidorId),
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  cargarSeguidores: async (usuarioId) => {
    set({ isLoading: true, error: null });
    try {
      const seguidores = await socialService.obtenerSeguidores(usuarioId);
      set({ seguidores, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  cargarSeguidos: async (usuarioId) => {
    set({ isLoading: true, error: null });
    try {
      const seguidos = await socialService.obtenerSeguidos(usuarioId);
      set({ seguidos, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  cargarSolicitudes: async () => {
    set({ isLoading: true, error: null });
    try {
      const solicitudesPendientes = await socialService.obtenerSolicitudes();
      set({ solicitudesPendientes, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  cargarPerfilPublico: async (usuarioId) => {
    set({ isLoading: true, error: null });
    try {
      const perfilPublico = await socialService.obtenerPerfilPublico(usuarioId);
      set({ perfilPublico, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  buscarUsuarios: async (texto, soloCompartibles) => {
    if (!texto.trim()) {
      set({ resultadosBusqueda: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const resultadosBusqueda = soloCompartibles !== undefined
        ? await socialService.buscarUsuarios(texto, soloCompartibles)
        : await socialService.buscarUsuarios(texto);
      set({ resultadosBusqueda, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  bloquearUsuario: async (usuarioId) => {
    set({ error: null });
    try {
      await socialService.bloquearUsuario(usuarioId);
      set((s) => ({
        seguidores: s.seguidores.filter((u) => u.usuarioId !== usuarioId),
        seguidos: s.seguidos.filter((u) => u.usuarioId !== usuarioId),
        resultadosBusqueda: s.resultadosBusqueda.filter((u) => u.id !== usuarioId),
        perfilPublico:
          s.perfilPublico?.id === usuarioId
            ? { ...s.perfilPublico, estaBloqueado: true, esSeguido: false, haSolicitado: false }
            : s.perfilPublico,
      }));
      await get().cargarBloqueados();
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  desbloquearUsuario: async (usuarioId) => {
    set({ error: null });
    try {
      await socialService.desbloquearUsuario(usuarioId);
      set((s) => ({
        bloqueados: s.bloqueados.filter((u) => u.id !== usuarioId),
        perfilPublico:
          s.perfilPublico?.id === usuarioId
            ? { ...s.perfilPublico, estaBloqueado: false }
            : s.perfilPublico,
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  cargarBloqueados: async () => {
    set({ isLoading: true, error: null });
    try {
      const bloqueados = await socialService.obtenerBloqueados();
      set({ bloqueados, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...ESTADO_INICIAL }),
}));
