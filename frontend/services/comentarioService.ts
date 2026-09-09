import { apiClient } from './apiClient';

export interface Comentario {
  id: string;
  usuarioId: string;
  nombreUsuario?: string;
  avatarUsuario?: string;
  texto: string;
  createdAt: string;
  esAutor: boolean;
}

export const COMENTARIO_MAX_LENGTH = 500;

export const comentarioService = {
  obtenerComentarios: async (recetaId: string): Promise<Comentario[]> => {
    const { data } = await apiClient.get<Comentario[]>(`/recetas/${recetaId}/comentarios`);
    return data;
  },

  crearComentario: async (recetaId: string, texto: string): Promise<Comentario> => {
    const { data } = await apiClient.post<Comentario>(`/recetas/${recetaId}/comentarios`, { texto });
    return data;
  },

  eliminarComentario: async (recetaId: string, comentarioId: string): Promise<void> => {
    await apiClient.delete(`/recetas/${recetaId}/comentarios/${comentarioId}`);
  },
};
