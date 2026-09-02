import { apiClient } from './apiClient';
import { FiltrosReceta, filtrosRecetaAQuery, hayFiltros } from '@/constants/filtrosReceta';
import { Receta } from './recetaService';

export interface ContextoSocial {
  publicadaPorSeguido: boolean;
  autorEsSeguido: boolean;
  seguidosQueDieronLike: string[];
  compartidaContigo: boolean;
  textoContexto?: string | null;
}

export interface RecetaFeed {
  id: string;
  titulo: string;
  autorId: string;
  autorNombre?: string;
  autorUsuario?: string;
  autorFoto?: string;
  tiempoEstimado: number;
  dificultad: string;
  categoria?: string;
  numPersonas: number;
  etiquetas: string[];
  imagenUrl?: string;
  likes: number;
  yaLike: boolean;
  yaGuardada: boolean;
  coincidenciaDespensa: number;
  ingredientesDisponibles: number;
  ingredientesFaltantes: number;
  createdAt: string;
  motivoRecomendacion?: string | null;
  publicadaPorSeguido?: boolean;
  likesDeSeguidosCount?: number;
  contextoSocial?: ContextoSocial;
}

export interface FeedResponse {
  recetas: RecetaFeed[];
  pagina: number;
  totalPaginas: number;
  hayMas: boolean;
}

export interface PerfilGustos {
  usuarioId: string;
  categoriasPreferidas: Record<string, number>;
  etiquetasPreferidas: Record<string, number>;
  dificultadesPreferidas: Record<string, number>;
  tiempoMaximoHabitual: number | null;
  ingredientesHabituales: string[];
  updatedAt: string;
}

export const feedService = {
  obtenerFeed: async (
    pagina: number,
    tamaño: number,
    filtros?: FiltrosReceta
  ): Promise<FeedResponse> => {
    const { data } = await apiClient.get<FeedResponse>('/feed', {
      params:
        filtros && hayFiltros(filtros)
          ? filtrosRecetaAQuery(filtros, { pagina, tamaño })
          : { pagina, tamaño },
    });
    return data;
  },

  guardarReceta: async (id: string): Promise<void> => {
    await apiClient.post(`/feed/recetas/${id}/guardar`);
  },

  descartarReceta: async (id: string): Promise<void> => {
    await apiClient.post(`/feed/recetas/${id}/descartar`);
  },

  darLike: async (id: string): Promise<void> => {
    await apiClient.post(`/feed/recetas/${id}/like`);
  },

  quitarLike: async (id: string): Promise<void> => {
    await apiClient.delete(`/feed/recetas/${id}/like`);
  },

  deshacerUltimaAccion: async (): Promise<void> => {
    await apiClient.post('/feed/deshacer');
  },

  obtenerDetalle: async (id: string): Promise<Receta> => {
    const { data } = await apiClient.get<Receta>(`/feed/recetas/${id}`);
    return data;
  },

  inicializarPerfil: async (
    tiposCocinaPreferidos: string[],
    tiempoDisponible: string | null
  ): Promise<void> => {
    await apiClient.post('/feed/inicializar-perfil', { tiposCocinaPreferidos, tiempoDisponible });
  },

  obtenerPerfilGustos: async (): Promise<PerfilGustos> => {
    const { data } = await apiClient.get<PerfilGustos>('/feed/perfil-gustos');
    return data;
  },

  resetearPerfilGustos: async (): Promise<void> => {
    await apiClient.delete('/feed/perfil-gustos');
  },

  limpiarDescartadas: async (): Promise<void> => {
    await apiClient.delete('/feed/descartadas');
  },

  obtenerRecetasSeguidos: async (
    pagina: number,
    tamaño: number,
    filtros?: FiltrosReceta
  ): Promise<FeedResponse> => {
    const { data } = await apiClient.get<FeedResponse>('/feed/recetas-seguidos', {
      params:
        filtros && hayFiltros(filtros)
          ? filtrosRecetaAQuery(filtros, { pagina, tamaño })
          : { pagina, tamaño },
    });
    return data;
  },

  buscarRecetas: async (texto: string, filtros?: FiltrosReceta): Promise<RecetaFeed[]> => {
    const q = texto.trim();
    if (!q) return [];
    const params =
      filtros && hayFiltros(filtros)
        ? filtrosRecetaAQuery(filtros, { q })
        : new URLSearchParams({ q });
    const { data } = await apiClient.get<RecetaFeed[]>('/feed/buscar', { params });
    return data;
  },
};
