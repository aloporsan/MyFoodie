import { create } from 'zustand';
import { RecetaFeed, feedService } from '@/services/feedService';
import { handleApiError } from '@/utils/errorHandler';

const TAMAÑO_PAGINA = 10;

type TipoAccionFeed = 'guardada' | 'descartada' | 'like' | 'like_quitado';

interface AccionFeed {
  tipo: TipoAccionFeed;
  recetaId: string;
  receta?: RecetaFeed;
  indice?: number;
}

interface FeedState {
  recetas: RecetaFeed[];
  pagina: number;
  hayMas: boolean;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
  ultimaAccion: AccionFeed | null;
}

interface FeedActions {
  cargarFeed: () => Promise<void>;
  cargarMas: () => Promise<void>;
  guardarReceta: (id: string) => Promise<void>;
  descartarReceta: (id: string) => Promise<void>;
  darLike: (id: string) => Promise<void>;
  quitarLike: (id: string) => Promise<void>;
  deshacerUltimaAccion: () => Promise<void>;
  limpiarFeed: () => void;
}

const ESTADO_INICIAL: FeedState = {
  recetas: [],
  pagina: 0,
  hayMas: false,
  isLoading: false,
  isLoadingMas: false,
  error: null,
  ultimaAccion: null,
};

export const useFeedStore = create<FeedState & FeedActions>()((set, get) => ({
  ...ESTADO_INICIAL,

  cargarFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const respuesta = await feedService.obtenerFeed(0, TAMAÑO_PAGINA);
      set({
        recetas: respuesta.recetas,
        pagina: respuesta.pagina,
        hayMas: respuesta.hayMas,
        isLoading: false,
      });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  cargarMas: async () => {
    const { hayMas, isLoadingMas, pagina } = get();
    if (!hayMas || isLoadingMas) return;

    set({ isLoadingMas: true, error: null });
    try {
      const respuesta = await feedService.obtenerFeed(pagina + 1, TAMAÑO_PAGINA);
      set((s) => ({
        recetas: [...s.recetas, ...respuesta.recetas],
        pagina: respuesta.pagina,
        hayMas: respuesta.hayMas,
        isLoadingMas: false,
      }));
    } catch (e) {
      set({ error: handleApiError(e), isLoadingMas: false });
    }
  },

  guardarReceta: async (id) => {
    const snapshotRecetas = get().recetas;
    const snapshotUltimaAccion = get().ultimaAccion;

    const indice = snapshotRecetas.findIndex((r) => r.id === id);
    const receta = indice >= 0 ? snapshotRecetas[indice] : undefined;

    set({
      error: null,
      recetas: snapshotRecetas.filter((r) => r.id !== id),
      ultimaAccion: { tipo: 'guardada', recetaId: id, receta, indice },
    });

    feedService.guardarReceta(id).catch((e) => {
      set({
        error: handleApiError(e),
        recetas: snapshotRecetas,
        ultimaAccion: snapshotUltimaAccion,
      });
    });
  },

  descartarReceta: async (id) => {
    const snapshotRecetas = get().recetas;
    const snapshotUltimaAccion = get().ultimaAccion;

    const indice = snapshotRecetas.findIndex((r) => r.id === id);
    const receta = indice >= 0 ? snapshotRecetas[indice] : undefined;

    set({
      error: null,
      recetas: snapshotRecetas.filter((r) => r.id !== id),
      ultimaAccion: { tipo: 'descartada', recetaId: id, receta, indice },
    });

    feedService.descartarReceta(id).catch((e) => {
      set({
        error: handleApiError(e),
        recetas: snapshotRecetas,
        ultimaAccion: snapshotUltimaAccion,
      });
    });
  },

  darLike: async (id) => {
    set({ error: null });
    try {
      await feedService.darLike(id);
      set((s) => ({
        recetas: s.recetas.map((r) =>
          r.id === id ? { ...r, yaLike: true, likes: r.likes + 1 } : r
        ),
        ultimaAccion: { tipo: 'like', recetaId: id },
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  quitarLike: async (id) => {
    set({ error: null });
    try {
      await feedService.quitarLike(id);
      set((s) => ({
        recetas: s.recetas.map((r) =>
          r.id === id ? { ...r, yaLike: false, likes: Math.max(0, r.likes - 1) } : r
        ),
        ultimaAccion: { tipo: 'like_quitado', recetaId: id },
      }));
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  deshacerUltimaAccion: async () => {
    const accion = get().ultimaAccion;
    if (!accion) return;

    set({ error: null });
    try {
      await feedService.deshacerUltimaAccion();
      set((s) => {
        switch (accion.tipo) {
          case 'guardada':
          case 'descartada': {
            if (!accion.receta) return { ultimaAccion: null };
            const recetas = [...s.recetas];
            const indice = Math.min(accion.indice ?? 0, recetas.length);
            recetas.splice(indice, 0, accion.receta);
            return { recetas, ultimaAccion: null };
          }
          case 'like':
            return {
              recetas: s.recetas.map((r) =>
                r.id === accion.recetaId
                  ? { ...r, yaLike: false, likes: Math.max(0, r.likes - 1) }
                  : r
              ),
              ultimaAccion: null,
            };
          case 'like_quitado':
            return {
              recetas: s.recetas.map((r) =>
                r.id === accion.recetaId ? { ...r, yaLike: true, likes: r.likes + 1 } : r
              ),
              ultimaAccion: null,
            };
          default:
            return { ultimaAccion: null };
        }
      });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  limpiarFeed: () => set({ ...ESTADO_INICIAL }),
}));
