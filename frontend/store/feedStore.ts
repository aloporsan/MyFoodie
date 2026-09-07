import { create } from 'zustand';
import {
  FiltrosReceta,
  FILTROS_RECETA_VACIOS,
  hayFiltros,
} from '@/constants/filtrosReceta';
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
  filtros: FiltrosReceta;
  pagina: number;
  hayMas: boolean;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
  ultimaAccion: AccionFeed | null;
  /**
   * IDs de recetas guardadas o descartadas en esta sesión. El backend tarda un instante en
   * persistir la acción, así que si una página llega antes de que confirme, la receta podría
   * volver a aparecer: la ocultamos localmente hasta que se recargue el feed desde cero.
   */
  idsOcultos: Set<string>;
  perfilGustos: PerfilGustos | null;
  isLoadingPerfilGustos: boolean;
}

interface FeedActions {
  cargarFeed: (fuente?: FuenteFeed) => Promise<void>;
  aplicarFiltros: (filtros: FiltrosReceta) => Promise<void>;
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
  filtros: FILTROS_RECETA_VACIOS,
  pagina: 0,
  hayMas: false,
  isLoading: false,
  isLoadingMas: false,
  error: null,
  ultimaAccion: null,
  idsOcultos: new Set<string>(),
  perfilGustos: null,
  isLoadingPerfilGustos: false,
};

function cargarPagina(fuente: FuenteFeed, filtros: FiltrosReceta, pagina: number) {
  const conFiltros = hayFiltros(filtros);
  if (fuente === 'seguidos') {
    return conFiltros
      ? feedService.obtenerRecetasSeguidos(pagina, TAMAÑO_PAGINA, filtros)
      : feedService.obtenerRecetasSeguidos(pagina, TAMAÑO_PAGINA);
  }
  return conFiltros
    ? feedService.obtenerFeed(pagina, TAMAÑO_PAGINA, filtros)
    : feedService.obtenerFeed(pagina, TAMAÑO_PAGINA);
}

export const useFeedStore = create<FeedState & FeedActions>()((set, get) => ({
  ...ESTADO_INICIAL,

  cargarFeed: async (fuente = 'para-ti') => {
    const { filtros } = get();
    set({ isLoading: true, error: null, fuente });
    try {
      const respuesta = await cargarPagina(fuente, filtros, 0);
      const { idsOcultos } = get();
      set({
        recetas: respuesta.recetas.filter((r) => !idsOcultos.has(r.id)),
        pagina: respuesta.pagina,
        hayMas: respuesta.hayMas,
        isLoading: false,
      });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
    }
  },

  aplicarFiltros: async (filtros) => {
    set({ filtros });
    await get().cargarFeed(get().fuente);
  },

  cargarMas: async () => {
    const { hayMas, isLoadingMas, pagina, fuente, filtros } = get();
    if (!hayMas || isLoadingMas) return;

    set({ isLoadingMas: true, error: null });
    try {
      const respuesta = await cargarPagina(fuente, filtros, pagina + 1);
      set((s) => {
        const yaEnLista = new Set(s.recetas.map((r) => r.id));
        const nuevas = respuesta.recetas.filter(
          (r) => !s.idsOcultos.has(r.id) && !yaEnLista.has(r.id),
        );
        return {
          recetas: [...s.recetas, ...nuevas],
          pagina: respuesta.pagina,
          hayMas: respuesta.hayMas,
          isLoadingMas: false,
        };
      });
    } catch (e) {
      set({ error: handleApiError(e), isLoadingMas: false });
    }
  },

  guardarReceta: async (id) => {
    const snapshotRecetas = get().recetas;
    const snapshotUltimaAccion = get().ultimaAccion;

    const indice = snapshotRecetas.findIndex((r) => r.id === id);
    const receta = indice >= 0 ? snapshotRecetas[indice] : undefined;

    set((s) => ({
      error: null,
      recetas: snapshotRecetas.filter((r) => r.id !== id),
      idsOcultos: new Set(s.idsOcultos).add(id),
      ultimaAccion: { tipo: 'guardada', recetaId: id, receta, indice },
    }));

    feedService.guardarReceta(id).catch((e) => {
      set((s) => {
        const idsOcultos = new Set(s.idsOcultos);
        idsOcultos.delete(id);
        return {
          error: handleApiError(e),
          recetas: snapshotRecetas,
          idsOcultos,
          ultimaAccion: snapshotUltimaAccion,
        };
      });
    });
  },

  descartarReceta: async (id) => {
    const snapshotRecetas = get().recetas;
    const snapshotUltimaAccion = get().ultimaAccion;

    const indice = snapshotRecetas.findIndex((r) => r.id === id);
    const receta = indice >= 0 ? snapshotRecetas[indice] : undefined;

    set((s) => ({
      error: null,
      recetas: snapshotRecetas.filter((r) => r.id !== id),
      idsOcultos: new Set(s.idsOcultos).add(id),
      ultimaAccion: { tipo: 'descartada', recetaId: id, receta, indice },
    }));

    feedService.descartarReceta(id).catch((e) => {
      set((s) => {
        const idsOcultos = new Set(s.idsOcultos);
        idsOcultos.delete(id);
        return {
          error: handleApiError(e),
          recetas: snapshotRecetas,
          idsOcultos,
          ultimaAccion: snapshotUltimaAccion,
        };
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
            const idsOcultos = new Set(s.idsOcultos);
            idsOcultos.delete(accion.recetaId);
            if (!accion.receta) return { idsOcultos, ultimaAccion: null };
            const recetas = [...s.recetas];
            const indice = Math.min(accion.indice ?? 0, recetas.length);
            recetas.splice(indice, 0, accion.receta);
            return { recetas, idsOcultos, ultimaAccion: null };
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

  limpiarFeed: () => set({ ...ESTADO_INICIAL, idsOcultos: new Set<string>() }),

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
      set({ idsOcultos: new Set<string>() });
      await get().cargarFeed(get().fuente);
    } catch (e) {
      set({ error: handleApiError(e) });
      throw e;
    }
  },
}));
