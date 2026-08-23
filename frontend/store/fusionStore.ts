import { create } from 'zustand';
import { matchingService, ParDuplicado } from '@/services/matchingService';
import { handleApiError } from '@/utils/errorHandler';
import { useDespensaStore } from './despensaStore';

interface FusionState {
  duplicados: ParDuplicado[];
  isLoading: boolean;
  error: string | null;
}

interface FusionActions {
  cargarDuplicados: () => Promise<void>;
  fusionarProductos: (
    productoMantenerId: string,
    productoEliminarId: string,
    unidadElegida?: string,
    fechaCaducidadElegida?: string
  ) => Promise<void>;
  ignorarFusion: (productoAId: string, productoBId: string) => Promise<void>;
  clearError: () => void;
}

const quitarPar = (duplicados: ParDuplicado[], idA: string, idB: string): ParDuplicado[] =>
  duplicados.filter(
    (par) =>
      !(
        (par.productoA.id === idA && par.productoB.id === idB) ||
        (par.productoA.id === idB && par.productoB.id === idA)
      )
  );

export const useFusionStore = create<FusionState & FusionActions>()((set, get) => ({
  duplicados: [],
  isLoading: false,
  error: null,

  cargarDuplicados: async () => {
    set({ isLoading: true, error: null });
    try {
      const duplicados = await matchingService.obtenerDuplicados();
      set({ duplicados, isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  fusionarProductos: async (productoMantenerId, productoEliminarId, unidadElegida, fechaCaducidadElegida) => {
    set({ isLoading: true, error: null });
    try {
      await matchingService.fusionarProductos(
        productoMantenerId,
        productoEliminarId,
        unidadElegida,
        fechaCaducidadElegida
      );
      set({
        duplicados: quitarPar(get().duplicados, productoMantenerId, productoEliminarId),
        isLoading: false,
      });
      await useDespensaStore.getState().cargarProductos();
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  ignorarFusion: async (productoAId, productoBId) => {
    set({ isLoading: true, error: null });
    try {
      await matchingService.ignorarFusion(productoAId, productoBId);
      set({
        duplicados: quitarPar(get().duplicados, productoAId, productoBId),
        isLoading: false,
      });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
