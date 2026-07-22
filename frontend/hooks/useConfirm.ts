import { create } from 'zustand';

export interface ConfirmButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export type ConfirmVariant = 'default' | 'danger' | 'warning';

interface ConfirmOptions {
  icon?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  variant: ConfirmVariant;
  buttons: ConfirmButton[];
  show: (title: string, message?: string, buttons?: ConfirmButton[], options?: ConfirmOptions) => void;
  hide: () => void;
}

export const useConfirmStore = create<ConfirmState>()((set) => ({
  visible: false,
  title: '',
  message: undefined,
  icon: undefined,
  variant: 'default',
  buttons: [],
  show: (title, message, buttons, options) => {
    const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
    const variant = options?.variant
      ?? (finalButtons.some((b) => b.style === 'destructive') ? 'danger' : 'default');
    set({
      visible: true,
      title,
      message,
      icon: options?.icon,
      variant,
      buttons: finalButtons,
    });
  },
  hide: () => set({ visible: false }),
}));

export function showConfirm(
  title: string,
  message?: string,
  buttons?: ConfirmButton[],
  options?: ConfirmOptions
) {
  useConfirmStore.getState().show(title, message, buttons, options);
}
