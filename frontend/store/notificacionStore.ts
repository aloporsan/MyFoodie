import { create } from 'zustand';
import { Notificacion, notificacionService } from '@/services/notificacionService';
import { handleApiError } from '@/utils/errorHandler';

interface NotificacionState {
  notificaciones: Notificacion[];
  contadorNoLeidas: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificacionActions {
  cargarNotificaciones: (pagina?: number, tamaño?: number) => Promise<void>;
  cargarContador: () => Promise<void>;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  registrarPushToken: (token: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ESTADO_INICIAL: NotificacionState = {
  notificaciones: [],
  contadorNoLeidas: 0,
  isLoading: false,
  error: null,
};

export const useNotificacionStore = create<NotificacionState & NotificacionActions>()(
  (set, get) => ({
    ...ESTADO_INICIAL,

    cargarNotificaciones: async (pagina = 0, tamaño = 20) => {
      set({ isLoading: true, error: null });
      try {
        const notificaciones = await notificacionService.obtenerNotificaciones(pagina, tamaño);
        set({ notificaciones, isLoading: false });
      } catch (e) {
        set({ error: handleApiError(e), isLoading: false });
      }
    },

    cargarContador: async () => {
      try {
        const contadorNoLeidas = await notificacionService.obtenerContador();
        set({ contadorNoLeidas });
      } catch (e) {
        set({ error: handleApiError(e) });
      }
    },

    marcarComoLeida: async (id) => {
      set({ error: null });
      try {
        await notificacionService.marcarComoLeida(id);
        set((s) => ({
          notificaciones: s.notificaciones.map((n) =>
            n.id === id ? { ...n, leida: true } : n
          ),
        }));
        await get().cargarContador();
      } catch (e) {
        set({ error: handleApiError(e) });
        throw e;
      }
    },

    marcarTodasComoLeidas: async () => {
      set({ error: null });
      try {
        await notificacionService.marcarTodasComoLeidas();
        set((s) => ({
          notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })),
          contadorNoLeidas: 0,
        }));
      } catch (e) {
        set({ error: handleApiError(e) });
        throw e;
      }
    },

    eliminarNotificacion: async (id) => {
      set({ error: null });
      try {
        await notificacionService.eliminarNotificacion(id);
        set((s) => ({
          notificaciones: s.notificaciones.filter((n) => n.id !== id),
        }));
        await get().cargarContador();
      } catch (e) {
        set({ error: handleApiError(e) });
        throw e;
      }
    },

    registrarPushToken: async (token) => {
      try {
        await notificacionService.registrarPushToken(token);
      } catch (e) {
        set({ error: handleApiError(e) });
      }
    },

    clearError: () => set({ error: null }),

    reset: () => set({ ...ESTADO_INICIAL }),
  })
);
