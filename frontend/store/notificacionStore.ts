import { create } from 'zustand';
import { notificacionService } from '@/services/notificacionService';
import { handleApiError } from '@/utils/errorHandler';

interface NotificacionState {
  contadorNoLeidas: number;
  error: string | null;
}

interface NotificacionActions {
  cargarContador: () => Promise<void>;
  reset: () => void;
}

const ESTADO_INICIAL: NotificacionState = {
  contadorNoLeidas: 0,
  error: null,
};

export const useNotificacionStore = create<NotificacionState & NotificacionActions>()((set) => ({
  ...ESTADO_INICIAL,

  cargarContador: async () => {
    try {
      const contadorNoLeidas = await notificacionService.obtenerContador();
      set({ contadorNoLeidas });
    } catch (e) {
      set({ error: handleApiError(e) });
    }
  },

  reset: () => set({ ...ESTADO_INICIAL }),
}));
