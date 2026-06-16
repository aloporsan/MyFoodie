import { act, renderHook } from '@testing-library/react-native';
import { useToast, useToastStore } from '@/hooks/useToast';

beforeEach(() => {
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
});

it('showSuccess_establece_tipo_success', () => {
  const { result } = renderHook(() => useToast());
  act(() => result.current.showSuccess('Guardado'));
  expect(useToastStore.getState().tipo).toBe('success');
  expect(useToastStore.getState().visible).toBe(true);
  expect(useToastStore.getState().mensaje).toBe('Guardado');
});

it('showError_establece_tipo_error', () => {
  const { result } = renderHook(() => useToast());
  act(() => result.current.showError('Fallo'));
  expect(useToastStore.getState().tipo).toBe('error');
  expect(useToastStore.getState().mensaje).toBe('Fallo');
});

it('showInfo_establece_tipo_info', () => {
  const { result } = renderHook(() => useToast());
  act(() => result.current.showInfo('Información'));
  expect(useToastStore.getState().tipo).toBe('info');
});

it('showWarning_establece_tipo_warning', () => {
  const { result } = renderHook(() => useToast());
  act(() => result.current.showWarning('Aviso'));
  expect(useToastStore.getState().tipo).toBe('warning');
});
