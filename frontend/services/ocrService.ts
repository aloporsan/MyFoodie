import { apiClient } from './apiClient';
import { Producto } from './despensaService';

export interface ProductoTicket {
  nombreDetectado: string;
  cantidadDetectada: number | null;
  unidadDetectada: string | null;
  lineaOriginal: string;
}

export type AccionOCR = 'nuevo' | 'actualizado' | 'sugerencia';

export interface ResultadoOCR {
  productoTicket: ProductoTicket;
  accion: AccionOCR;
  productoExistente: Producto | null;
  similitud: number | null;
  mensajeSugerencia: string | null;
}

export type AccionConfirmacionOCR = 'nuevo' | 'actualizado' | 'ignorado';

export interface ProductoConfirmadoOCR {
  nombre: string;
  cantidad: number;
  unidad: string;
  fechaCaducidad?: string | null;
  accion: AccionConfirmacionOCR;
  productoExistenteId?: string | null;
}

export interface ResumenConfirmacionOCR {
  añadidos: number;
  actualizados: number;
  ignorados: number;
}

export const ocrService = {
  procesarTicket: async (imagen: FormData): Promise<ResultadoOCR[]> => {
    const { data } = await apiClient.post<ResultadoOCR[]>('/despensa/ocr/procesar', imagen, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  confirmarProductos: async (
    productos: ProductoConfirmadoOCR[]
  ): Promise<ResumenConfirmacionOCR> => {
    const { data } = await apiClient.post<ResumenConfirmacionOCR>(
      '/despensa/ocr/confirmar',
      productos
    );
    return data;
  },
};
