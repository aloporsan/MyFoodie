import { apiClient } from './apiClient';

export type TipoContenidoReporte = 'PERFIL' | 'RECETA' | 'COMENTARIO';

export type MotivoReporte =
  | 'CONTENIDO_OFENSIVO'
  | 'SPAM'
  | 'INFORMACION_INCORRECTA'
  | 'IMAGEN_INAPROPIADA'
  | 'OTRO';

export const MOTIVOS_REPORTE: { valor: MotivoReporte; etiqueta: string }[] = [
  { valor: 'CONTENIDO_OFENSIVO', etiqueta: 'Contenido ofensivo' },
  { valor: 'SPAM', etiqueta: 'Spam' },
  { valor: 'INFORMACION_INCORRECTA', etiqueta: 'Información incorrecta' },
  { valor: 'IMAGEN_INAPROPIADA', etiqueta: 'Imagen inapropiada' },
  { valor: 'OTRO', etiqueta: 'Otro motivo' },
];

export const REPORTE_DESCRIPCION_MAX_LENGTH = 500;

export interface CrearReporteInput {
  tipoContenido: TipoContenidoReporte;
  contenidoId: string;
  motivo: MotivoReporte;
  descripcionAdicional?: string;
}

export interface Reporte {
  id: string;
  tipoContenido: TipoContenidoReporte;
  contenidoId: string;
  motivo: MotivoReporte;
  descripcionAdicional?: string;
  estado: 'PENDIENTE' | 'REVISADO' | 'DESESTIMADO';
  createdAt: string;
}

export const reporteService = {
  crearReporte: async (datos: CrearReporteInput): Promise<Reporte> => {
    const { data } = await apiClient.post<Reporte>('/reportes', datos);
    return data;
  },
};
