import { create } from 'zustand';
import {
  Receta,
  RecetaResumen,
  RecetaInput,
  IngredienteInput,
  PasoInput,
  recetaService,
} from '@/services/recetaService';

interface RecetaState {
  recetas: RecetaResumen[];
  borradores: RecetaResumen[];
  recetaActual: Receta | null;
  isLoading: boolean;
  error: string | null;
}

interface RecetaActions {
  cargarMisRecetas: () => Promise<void>;
  cargarMisBorradores: () => Promise<void>;
  cargarReceta: (id: string) => Promise<void>;
  crearReceta: (datos: RecetaInput) => Promise<Receta>;
  editarReceta: (id: string, datos: RecetaInput) => Promise<void>;
  eliminarReceta: (id: string) => Promise<void>;
  publicarReceta: (id: string) => Promise<void>;
  guardarComoBorrador: (id: string) => Promise<void>;
  actualizarImagen: (id: string, imagenUrl: string) => Promise<void>;
  actualizarEtiquetas: (id: string, etiquetas: string[]) => Promise<void>;
  añadirIngrediente: (id: string, datos: IngredienteInput) => Promise<void>;
  eliminarIngrediente: (id: string, ingredienteId: string) => Promise<void>;
  añadirPaso: (id: string, datos: PasoInput) => Promise<void>;
  eliminarPaso: (id: string, pasoId: string) => Promise<void>;
  reordenarPasos: (id: string, ordenIds: string[]) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useRecetaStore = create<RecetaState & RecetaActions>()((set) => ({
  recetas: [],
  borradores: [],
  recetaActual: null,
  isLoading: false,
  error: null,

  cargarMisRecetas: async () => {
    set({ isLoading: true, error: null });
    try {
      const recetas = await recetaService.misRecetas();
      set({ recetas, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Error al cargar recetas',
        isLoading: false,
      });
    }
  },

  cargarMisBorradores: async () => {
    set({ isLoading: true, error: null });
    try {
      const borradores = await recetaService.misBorradores();
      set({ borradores, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Error al cargar borradores',
        isLoading: false,
      });
    }
  },

  cargarReceta: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const recetaActual = await recetaService.obtenerReceta(id);
      set({ recetaActual, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Error al cargar la receta',
        isLoading: false,
      });
    }
  },

  crearReceta: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      const nueva = await recetaService.crearReceta(datos);
      set((s) => ({ borradores: [...s.borradores, nueva], recetaActual: nueva, isLoading: false }));
      return nueva;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al crear la receta';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  editarReceta: async (id, datos) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.editarReceta(id, datos);
      set((s) => ({
        recetaActual: actualizada,
        borradores: s.borradores.map((r) => (r.id === id ? actualizada : r)),
        recetas: s.recetas.map((r) => (r.id === id ? actualizada : r)),
        isLoading: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al editar la receta';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  eliminarReceta: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await recetaService.eliminarReceta(id);
      set((s) => ({
        recetas: s.recetas.filter((r) => r.id !== id),
        borradores: s.borradores.filter((r) => r.id !== id),
        recetaActual: s.recetaActual?.id === id ? null : s.recetaActual,
        isLoading: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar la receta';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  publicarReceta: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.publicarReceta(id);
      set((s) => ({
        recetaActual: actualizada,
        recetas: [...s.recetas, actualizada],
        borradores: s.borradores.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al publicar la receta';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  guardarComoBorrador: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.guardarComoBorrador(id);
      set((s) => ({
        recetaActual: actualizada,
        borradores: [...s.borradores, actualizada],
        recetas: s.recetas.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar como borrador';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  actualizarImagen: async (id, imagenUrl) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.actualizarImagen(id, imagenUrl);
      set({ recetaActual: actualizada, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar la imagen';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  actualizarEtiquetas: async (id, etiquetas) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.actualizarEtiquetas(id, etiquetas);
      set({ recetaActual: actualizada, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar etiquetas';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  añadirIngrediente: async (id, datos) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.añadirIngrediente(id, datos);
      set({ recetaActual: actualizada, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al añadir ingrediente';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  eliminarIngrediente: async (id, ingredienteId) => {
    set({ isLoading: true, error: null });
    try {
      await recetaService.eliminarIngrediente(id, ingredienteId);
      set((s) => ({
        recetaActual: s.recetaActual
          ? {
              ...s.recetaActual,
              ingredientes: s.recetaActual.ingredientes.filter((i) => i.id !== ingredienteId),
            }
          : null,
        isLoading: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar ingrediente';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  añadirPaso: async (id, datos) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.añadirPaso(id, datos);
      set({ recetaActual: actualizada, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al añadir paso';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  eliminarPaso: async (id, pasoId) => {
    set({ isLoading: true, error: null });
    try {
      await recetaService.eliminarPaso(id, pasoId);
      set((s) => ({
        recetaActual: s.recetaActual
          ? {
              ...s.recetaActual,
              pasos: s.recetaActual.pasos
                .filter((p) => p.id !== pasoId)
                .map((p, i) => ({ ...p, orden: i + 1 })),
            }
          : null,
        isLoading: false,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar paso';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  reordenarPasos: async (id, ordenIds) => {
    set({ isLoading: true, error: null });
    try {
      const actualizada = await recetaService.reordenarPasos(id, ordenIds);
      set({ recetaActual: actualizada, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al reordenar pasos';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({ recetas: [], borradores: [], recetaActual: null, isLoading: false, error: null }),
}));
