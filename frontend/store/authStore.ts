import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (datos: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (_email, _password) => {
        set({ isLoading: true, error: null });
        try {
          // Placeholder — se implementa en commit 4 con authService
          set({ isLoading: false });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Credenciales incorrectas';
          set({ isLoading: false, error: msg });
          throw e;
        }
      },

      register: async (_datos) => {
        set({ isLoading: true, error: null });
        try {
          // Placeholder — se implementa en commit 4 con authService
          set({ isLoading: false });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Error al registrarse';
          set({ isLoading: false, error: msg });
          throw e;
        }
      },

      logout: async () => {
        set({ token: null, usuario: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
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
