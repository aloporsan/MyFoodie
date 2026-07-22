import { act, renderHook } from '@testing-library/react-native';
import { useError } from '@/hooks/useError';

it('estado_inicial_sin_error', () => {
  const { result } = renderHook(() => useError());
  expect(result.current.error).toBeNull();
  expect(result.current.hasError).toBe(false);
});

it('setError_establece_el_mensaje', () => {
  const { result } = renderHook(() => useError());
  act(() => result.current.setError('Algo falló'));
  expect(result.current.error).toBe('Algo falló');
});

it('clearError_limpia_el_error', () => {
  const { result } = renderHook(() => useError());
  act(() => result.current.setError('Error'));
  act(() => result.current.clearError());
  expect(result.current.error).toBeNull();
});

it('hasError_es_true_cuando_hay_error', () => {
  const { result } = renderHook(() => useError());
  act(() => result.current.setError('Error presente'));
  expect(result.current.hasError).toBe(true);
});
