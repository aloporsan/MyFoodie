import { apiClient } from './apiClient';

export type EstadoReceta = 'borrador' | 'publicada';

export interface IngredienteReceta {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  observacion?: string;
}

export interface PasoReceta {
  id: string;
  orden: number;
  descripcion: string;
  imagenUrl?: string;
}

export interface Receta {
  id: string;
  autorId: string;
  autorNombre?: string;
  autorNombreUsuario?: string;
  titulo: string;
  descripcion: string;
  tiempoEstimado: number;
  dificultad: string;
  categoria: string;
  etiquetas: string[];
  imagenUrl?: string;
  estado: EstadoReceta;
  numPersonas: number;
  totalLikes?: number;
  likeUsuario?: boolean;
  ingredientes: IngredienteReceta[];
  pasos: PasoReceta[];
  createdAt: string;
  updatedAt: string;
}

export interface RecetaResumen {
  id: string;
  autorId: string;
  titulo: string;
  descripcion: string;
  tiempoEstimado: number;
  dificultad: string;
  categoria: string;
  etiquetas: string[];
  imagenUrl?: string;
  estado: EstadoReceta;
  createdAt: string;
  updatedAt: string;
}

export interface RecetaInput {
  titulo: string;
  descripcion: string;
  tiempoEstimado: number;
  dificultad: string;
  categoria: string;
  etiquetas: string[];
  imagenUrl?: string;
  numPersonas?: number;
}

export interface IngredienteInput {
  nombre: string;
  cantidad: number;
  unidad: string;
  observacion?: string;
}

export interface PasoInput {
  descripcion: string;
  imagenUrl?: string;
}

export const recetaService = {
  crearReceta: async (datos: RecetaInput): Promise<Receta> => {
    const { data } = await apiClient.post<Receta>('/recetas', datos);
    return data;
  },

  obtenerReceta: async (id: string): Promise<Receta> => {
    const { data } = await apiClient.get<Receta>(`/recetas/${id}`);
    return data;
  },

  editarReceta: async (id: string, datos: RecetaInput): Promise<Receta> => {
    const { data } = await apiClient.put<Receta>(`/recetas/${id}`, datos);
    return data;
  },

  eliminarReceta: async (id: string): Promise<void> => {
    await apiClient.delete(`/recetas/${id}`);
  },

  publicarReceta: async (id: string): Promise<Receta> => {
    const { data } = await apiClient.post<Receta>(`/recetas/${id}/publicar`);
    return data;
  },

  guardarComoBorrador: async (id: string): Promise<Receta> => {
    const { data } = await apiClient.post<Receta>(`/recetas/${id}/borrador`);
    return data;
  },

  actualizarImagen: async (id: string, imagenUrl: string): Promise<Receta> => {
    const { data } = await apiClient.put<Receta>(`/recetas/${id}/imagen`, { imagenUrl });
    return data;
  },

  actualizarEtiquetas: async (id: string, etiquetas: string[]): Promise<Receta> => {
    const { data } = await apiClient.put<Receta>(`/recetas/${id}/etiquetas`, etiquetas);
    return data;
  },

  añadirIngrediente: async (id: string, datos: IngredienteInput): Promise<Receta> => {
    const { data } = await apiClient.post<Receta>(`/recetas/${id}/ingredientes`, datos);
    return data;
  },

  eliminarIngrediente: async (id: string, ingredienteId: string): Promise<void> => {
    await apiClient.delete(`/recetas/${id}/ingredientes/${ingredienteId}`);
  },

  añadirPaso: async (id: string, datos: PasoInput): Promise<Receta> => {
    const { data } = await apiClient.post<Receta>(`/recetas/${id}/pasos`, datos);
    return data;
  },

  eliminarPaso: async (id: string, pasoId: string): Promise<void> => {
    await apiClient.delete(`/recetas/${id}/pasos/${pasoId}`);
  },

  reordenarPasos: async (id: string, ordenIds: string[]): Promise<Receta> => {
    const { data } = await apiClient.put<Receta>(`/recetas/${id}/pasos/reordenar`, ordenIds);
    return data;
  },

  misRecetas: async (): Promise<Receta[]> => {
    const { data } = await apiClient.get<Receta[]>('/recetas/mis-recetas');
    return data;
  },

  misBorradores: async (): Promise<RecetaResumen[]> => {
    const { data } = await apiClient.get<RecetaResumen[]>('/recetas/mis-borradores');
    return data;
  },

  recetasGuardadas: async (): Promise<Receta[]> => {
    const { data } = await apiClient.get<Receta[]>('/recetas/guardadas');
    return data;
  },

  guardarReceta: async (id: string): Promise<void> => {
    await apiClient.post(`/recetas/${id}/guardar`);
  },

  eliminarGuardado: async (id: string): Promise<void> => {
    await apiClient.delete(`/recetas/${id}/guardar`);
  },
};
