import { create } from 'zustand';
import {
  IngredienteFaltante,
  RecetaCompartida,
  compartirService,
} from '@/services/compartirService';
import { handleApiError } from '@/utils/errorHandler';

interface CompartirState {
  recetasRecibidas: RecetaCompartida[];
  contadorNoLeidas: number;
  ingredientesFaltantes: IngredienteFaltante[];
  isLoading: boolean;
  error: string | null;
}

interface CompartirActions {
  cargarRecibidas: () => Promise<void>;
  marcarComoLeida: (id: string) => Promise<void>;
  guardarRecetaCompartida: (id: string) => Promise<void>;
  cargarContador: () => Promise<void>;
  cargarIngredientesFaltantes: (id: string) => Promise<void>;
  compartirReceta: (recetaId: string, receptorIds: string[], mensaje?: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ESTADO_INICIAL: CompartirState = {
  recetasRecibidas: [],
  contadorNoLeidas: 0,
  ingredientesFaltantes: [],
  isLoading: false,
  error: null,
};

export const useCompartirStore = create<CompartirState & CompartirActions>()((set, get) => ({
  ...ESTADO_INICIAL,

  cargarRecibidas: async () => {
    set({ isLoading: true, error: null });
    try {
      const recetasRecibidas = await compartirService.obtenerRecibidas();
      set({ recetasRecibidas, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  marcarComoLeida: async (id) => {
    set({ error: null });
    try {
      await compartirService.marcarComoLeida(id);
      set((s) => ({
        recetasRecibidas: s.recetasRecibidas.map((r) =>
          r.id === id ? { ...r, leida: true } : r
        ),
      }));
      await get().cargarContador();
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  guardarRecetaCompartida: async (id) => {
    set({ error: null });
    try {
      await compartirService.guardarRecetaCompartida(id);
      set((s) => ({
        recetasRecibidas: s.recetasRecibidas.map((r) =>
          r.id === id ? { ...r, leida: true } : r
        ),
      }));
      await get().cargarContador();
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  cargarContador: async () => {
    try {
      const contadorNoLeidas = await compartirService.obtenerContador();
      set({ contadorNoLeidas });
    } catch (e) {
      set({ error: handleApiError(e) });
    }
  },

  cargarIngredientesFaltantes: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const ingredientesFaltantes = await compartirService.obtenerIngredientesFaltantes(id);
      set({ ingredientesFaltantes, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  compartirReceta: async (recetaId, receptorIds, mensaje) => {
    set({ error: null });
    try {
      await compartirService.compartirReceta(recetaId, receptorIds, mensaje);
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ ...ESTADO_INICIAL }),
}));
