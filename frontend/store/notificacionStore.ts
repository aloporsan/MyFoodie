import { create } from 'zustand';
import {
  Notificacion,
  PreferenciasNotificacion,
  notificacionService,
} from '@/services/notificacionService';
import { handleApiError } from '@/utils/errorHandler';

const TAMAÑO_PAGINA = 20;

interface NotificacionState {
  notificaciones: Notificacion[];
  pagina: number;
  hayMas: boolean;
  contadorNoLeidas: number;
  preferenciasNotificacion: PreferenciasNotificacion | null;
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
  eliminarNotificacion: (id: string) => void;
  registrarPushToken: (token: string) => Promise<void>;
  cargarPreferenciasNotificacion: () => Promise<void>;
  actualizarPreferenciasNotificacion: (datos: Partial<PreferenciasNotificacion>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ESTADO_INICIAL: NotificacionState = {
  notificaciones: [],
  pagina: 0,
  hayMas: false,
  contadorNoLeidas: 0,
  preferenciasNotificacion: null,
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

    eliminarNotificacion: (id) => {
      const snapshotNotificaciones = get().notificaciones;
      const snapshotContador = get().contadorNoLeidas;
      const eliminada = snapshotNotificaciones.find((n) => n.id === id);
      if (!eliminada) return;

      // Actualización optimista: refleja el borrado al instante, sin esperar la red.
      set({
        error: null,
        notificaciones: snapshotNotificaciones.filter((n) => n.id !== id),
        contadorNoLeidas: eliminada.leida ? snapshotContador : Math.max(0, snapshotContador - 1),
      });

      notificacionService.eliminarNotificacion(id).catch((e) => {
        // Revierte la actualización optimista si la petición falla.
        set({
          error: handleApiError(e),
          notificaciones: snapshotNotificaciones,
          contadorNoLeidas: snapshotContador,
        });
      });
    },

    registrarPushToken: async (token) => {
      try {
        await notificacionService.registrarPushToken(token);
      } catch (e) {
        set({ error: handleApiError(e) });
      }
    },

    cargarPreferenciasNotificacion: async () => {
      try {
        const preferenciasNotificacion = await notificacionService.obtenerPreferencias();
        set({ preferenciasNotificacion });
      } catch (e) {
        set({ error: handleApiError(e) });
      }
    },

    actualizarPreferenciasNotificacion: async (datos) => {
      set({ error: null });
      try {
        const preferenciasNotificacion = await notificacionService.actualizarPreferencias(datos);
        set({ preferenciasNotificacion });
      } catch (e) {
        set({ error: handleApiError(e) });
        throw e;
      }
    },

    clearError: () => set({ error: null }),

    reset: () => set({ ...ESTADO_INICIAL }),
  })
);
