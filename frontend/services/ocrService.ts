import { apiClient, getAuthToken, getServerBaseUrl } from './apiClient';
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
  marca?: string | null;
  notas?: string | null;
  stockMinimo?: number | null;
  categoria?: string | null;
}

export interface ResumenConfirmacionOCR {
  añadidos: number;
  actualizados: number;
  ignorados: number;
}

export const ocrService = {
  procesarTicket: async (imagen: FormData): Promise<ResultadoOCR[]> => {
    // axios en React Native no detecta de forma fiable las instancias de FormData (falla
    // con "Network Error" antes de llegar a mandar la petición), así que para esta subida
    // de archivo usamos fetch nativo, que sí soporta FormData/multipart correctamente.
    // Timeout más largo que el resto de peticiones: subir la foto + la llamada a Vision API
    // + el matching contra la despensa puede tardar bastante más que una petición normal.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      const token = getAuthToken();
      response = await fetch(`${getServerBaseUrl()}/api/despensa/ocr/procesar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: imagen,
        signal: controller.signal,
      });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error('La operación ha tardado demasiado. Inténtalo de nuevo.');
      }
      throw new Error('Sin conexión. Comprueba tu red e inténtalo de nuevo.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let mensaje = 'No se pudo procesar el ticket. Inténtalo de nuevo.';
      try {
        const data = await response.json();
        if (data?.message) mensaje = data.message;
      } catch {
        // El cuerpo del error no era JSON: nos quedamos con el mensaje genérico.
      }
      throw new Error(mensaje);
    }

    return response.json();
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
