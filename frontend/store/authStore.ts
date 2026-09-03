import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { setTokenGetter } from '@/services/apiClient';
import { handleApiError } from '@/utils/errorHandler';

// El tour de bienvenida (5 pantallas) se muestra una sola vez por dispositivo.
// Persistimos con una clave propia en AsyncStorage, igual que el orden de la
// despensa (RF-DESP-017), en lugar de meterlo en el estado persistido de auth
// (que se limpia al cerrar sesión).
const ONBOARDING_STORAGE_KEY = 'onboardingVisto';

export interface Usuario {
  userId: string;
  email: string;
  nombreUsuario: string;
  nombre: string;
}

export interface RegisterData {
  nombre: string;
  nombreUsuario: string;
  email: string;
  password: string;
}

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  recienRegistrado: boolean;
  onboardingVisto: boolean;
  onboardingHidratado: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (datos: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  marcarOnboardingVisto: () => void;
  cargarOnboardingVisto: () => Promise<void>;
  completarOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      recienRegistrado: false,
      onboardingVisto: false,
      onboardingHidratado: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.login(email, password);
          set({
            token: res.token,
            usuario: { userId: res.userId, email: res.email, nombreUsuario: res.nombreUsuario, nombre: res.nombre },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (e: unknown) {
          set({ isLoading: false, error: handleApiError(e) });
          throw e;
        }
      },

      register: async (datos) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authService.register(datos);
          set({
            token: res.token,
            usuario: { userId: res.userId, email: res.email, nombreUsuario: res.nombreUsuario, nombre: res.nombre },
            isAuthenticated: true,
            isLoading: false,
            recienRegistrado: true,
          });
        } catch (e: unknown) {
          set({ isLoading: false, error: handleApiError(e) });
          throw e;
        }
      },

      logout: async () => {
        set({ token: null, usuario: null, isAuthenticated: false, error: null, recienRegistrado: false });
      },

      clearError: () => set({ error: null }),

      marcarOnboardingVisto: () => set({ recienRegistrado: false }),

      cargarOnboardingVisto: async () => {
        try {
          const guardado = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
          set({ onboardingVisto: guardado === 'true' });
        } finally {
          // Pase lo que pase, marcamos la hidratación como terminada para no
          // dejar la navegación bloqueada a la espera de esta lectura.
          set({ onboardingHidratado: true });
        }
      },

      completarOnboarding: async () => {
        set({ onboardingVisto: true });
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      },
    }),
    {
      name: 'myfoodie-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

setTokenGetter(() => useAuthStore.getState().token);
