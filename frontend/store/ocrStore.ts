import { create } from 'zustand';
import {
  ocrService,
  ProductoConfirmadoOCR,
  ResultadoOCR,
  ResumenConfirmacionOCR,
} from '@/services/ocrService';
import { handleApiError } from '@/utils/errorHandler';

interface OCRState {
  resultados: ResultadoOCR[];
  isProcessing: boolean;
  isConfirming: boolean;
  error: string | null;
}

interface OCRActions {
  procesarTicket: (imagen: FormData) => Promise<ResultadoOCR[]>;
  confirmarProductos: (productosAjustados: ProductoConfirmadoOCR[]) => Promise<ResumenConfirmacionOCR>;
  limpiarResultados: () => void;
}

const ESTADO_INICIAL: OCRState = {
  resultados: [],
  isProcessing: false,
  isConfirming: false,
  error: null,
};

export const useOCRStore = create<OCRState & OCRActions>()((set) => ({
  ...ESTADO_INICIAL,

  procesarTicket: async (imagen) => {
    set({ isProcessing: true, error: null });
    try {
      const resultados = await ocrService.procesarTicket(imagen);
      set({ resultados, isProcessing: false });
      return resultados;
    } catch (e) {
      set({ error: handleApiError(e), isProcessing: false });
      throw e;
    }
  },

  confirmarProductos: async (productosAjustados) => {
    set({ isConfirming: true, error: null });
    try {
      const resumen = await ocrService.confirmarProductos(productosAjustados);
      set({ isConfirming: false, resultados: [] });
      return resumen;
    } catch (e) {
      set({ error: handleApiError(e), isConfirming: false });
      throw e;
    }
  },

  limpiarResultados: () => set({ ...ESTADO_INICIAL }),
}));
