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

  validateToken: async (token: string): Promise<void> => {
    await apiClient.post('/auth/validate-token', { token });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, nuevaPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, nuevaPassword });
  },
};
