import { create } from 'zustand';
import { PerfilGustos, RecetaFeed, feedService } from '@/services/feedService';
import { handleApiError } from '@/utils/errorHandler';

const TAMAÑO_PAGINA = 10;

export type FuenteFeed = 'para-ti' | 'seguidos';

type TipoAccionFeed = 'guardada' | 'descartada' | 'like' | 'like_quitado';

interface AccionFeed {
  tipo: TipoAccionFeed;
  recetaId: string;
  receta?: RecetaFeed;
  indice?: number;
}

interface FeedState {
  recetas: RecetaFeed[];
  fuente: FuenteFeed;
  etiquetaSeleccionada: string | null;
  pagina: number;
  hayMas: boolean;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
  ultimaAccion: AccionFeed | null;
  perfilGustos: PerfilGustos | null;
  isLoadingPerfilGustos: boolean;
}

interface FeedActions {
  cargarFeed: (fuente?: FuenteFeed) => Promise<void>;
  filtrarPorEtiqueta: (etiqueta: string | null) => Promise<void>;
  cargarMas: () => Promise<void>;
  guardarReceta: (id: string) => Promise<void>;
  descartarReceta: (id: string) => Promise<void>;
  darLike: (id: string) => Promise<void>;
  quitarLike: (id: string) => Promise<void>;
  deshacerUltimaAccion: () => Promise<void>;
  limpiarFeed: () => void;
  cargarPerfilGustos: () => Promise<void>;
  resetearPerfilGustos: () => Promise<void>;
  limpiarDescartadas: () => Promise<void>;
}

const ESTADO_INICIAL: FeedState = {
  recetas: [],
  fuente: 'para-ti',
  etiquetaSeleccionada: null,
  pagina: 0,
  hayMas: false,
  isLoading: false,
  isLoadingMas: false,
  error: null,
  ultimaAccion: null,
  perfilGustos: null,
  isLoadingPerfilGustos: false,
};

function cargarPagina(fuente: FuenteFeed, etiqueta: string | null, pagina: number) {
  if (fuente === 'seguidos') {
    return feedService.obtenerRecetasSeguidos(pagina, TAMAÑO_PAGINA);
  }
  return etiqueta
    ? feedService.obtenerFeed(pagina, TAMAÑO_PAGINA, etiqueta)
    : feedService.obtenerFeed(pagina, TAMAÑO_PAGINA);
}

export const useFeedStore = create<FeedState & FeedActions>()((set, get) => ({
  ...ESTADO_INICIAL,

  cargarFeed: async (fuente = 'para-ti') => {
    // El filtro por etiqueta solo aplica al feed "para ti"; al ver "seguidos" se descarta.
    const etiquetaSeleccionada = fuente === 'seguidos' ? null : get().etiquetaSeleccionada;
    set({ isLoading: true, error: null, fuente, etiquetaSeleccionada });
    try {
      const respuesta = await cargarPagina(fuente, etiquetaSeleccionada, 0);
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

  filtrarPorEtiqueta: async (etiqueta) => {
    set({ etiquetaSeleccionada: etiqueta });
    await get().cargarFeed('para-ti');
  },

  cargarMas: async () => {
    const { hayMas, isLoadingMas, pagina, fuente, etiquetaSeleccionada } = get();
    if (!hayMas || isLoadingMas) return;

    set({ isLoadingMas: true, error: null });
    try {
      const respuesta = await cargarPagina(fuente, etiquetaSeleccionada, pagina + 1);
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

  cargarPerfilGustos: async () => {
    set({ isLoadingPerfilGustos: true, error: null });
    try {
      const perfilGustos = await feedService.obtenerPerfilGustos();
      set({ perfilGustos, isLoadingPerfilGustos: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoadingPerfilGustos: false });
    }
  },

  resetearPerfilGustos: async () => {
    set({ error: null });
    try {
      await feedService.resetearPerfilGustos();
      set({ perfilGustos: null });
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },

  limpiarDescartadas: async () => {
    set({ error: null });
    try {
      await feedService.limpiarDescartadas();
      await get().cargarFeed(get().fuente);
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },
}));
