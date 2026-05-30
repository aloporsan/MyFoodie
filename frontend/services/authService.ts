import type { RegisterData } from '@/store/authStore';
import { apiClient } from './apiClient';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  nombreUsuario: string;
  nombre: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  register: async (datos: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', datos);
    return data;
  },
};
