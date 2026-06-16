import { create } from 'zustand';
import type { ToastTipo } from '@/components/common/ToastMessage';

interface ToastState {
  visible: boolean;
  mensaje: string;
  tipo: ToastTipo;
  show: (tipo: ToastTipo, mensaje: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  visible: false,
  mensaje: '',
  tipo: 'success' as ToastTipo,
  show: (tipo, mensaje) => set({ visible: true, tipo, mensaje }),
  hide: () => set({ visible: false }),
}));

export function useToast() {
  const { show } = useToastStore();
  return {
    showSuccess: (mensaje: string) => show('success', mensaje),
    showError: (mensaje: string) => show('error', mensaje),
    showInfo: (mensaje: string) => show('info', mensaje),
    showWarning: (mensaje: string) => show('warning', mensaje),
  };
}
