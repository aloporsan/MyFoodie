import { create } from 'zustand';
import { Notificacion, notificacionService } from '@/services/notificacionService';
import { handleApiError } from '@/utils/errorHandler';

const TAMAÑO_PAGINA = 20;

interface NotificacionState {
  notificaciones: Notificacion[];
  pagina: number;
  hayMas: boolean;
  contadorNoLeidas: number;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: string | null;
}

interface NotificacionActions {
  cargarNotificaciones: () => Promise<void>;
  cargarMas: () => Promise<void>;
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
  pagina: 0,
  hayMas: false,
  contadorNoLeidas: 0,
  isLoading: false,
  isLoadingMas: false,
  error: null,
};

export const useNotificacionStore = create<NotificacionState & NotificacionActions>()(
  (set, get) => ({
    ...ESTADO_INICIAL,

    cargarNotificaciones: async () => {
      set({ isLoading: true, error: null });
      try {
        const notificaciones = await notificacionService.obtenerNotificaciones(0, TAMAÑO_PAGINA);
        set({
          notificaciones,
          pagina: 0,
          hayMas: notificaciones.length === TAMAÑO_PAGINA,
          isLoading: false,
        });
      } catch (e) {
        set({ error: handleApiError(e), isLoading: false });
      }
    },

    cargarMas: async () => {
      const { hayMas, isLoadingMas, pagina } = get();
      if (!hayMas || isLoadingMas) return;

      set({ isLoadingMas: true, error: null });
      try {
        const siguiente = pagina + 1;
        const nuevas = await notificacionService.obtenerNotificaciones(siguiente, TAMAÑO_PAGINA);
        set((s) => ({
          notificaciones: [...s.notificaciones, ...nuevas],
          pagina: siguiente,
          hayMas: nuevas.length === TAMAÑO_PAGINA,
          isLoadingMas: false,
        }));
      } catch (e) {
        set({ error: handleApiError(e), isLoadingMas: false });
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
