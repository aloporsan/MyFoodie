import { act, renderHook } from '@testing-library/react-native';
import { useLoading } from '@/hooks/useLoading';

it('estado_inicial_es_false', () => {
  const { result } = renderHook(() => useLoading());
  expect(result.current.isLoading).toBe(false);
  expect(result.current.loadingMessage).toBeUndefined();
});

it('startLoading_pone_isLoading_true', () => {
  const { result } = renderHook(() => useLoading());
  act(() => result.current.startLoading());
  expect(result.current.isLoading).toBe(true);
});

it('stopLoading_pone_isLoading_false', () => {
  const { result } = renderHook(() => useLoading());
  act(() => result.current.startLoading());
  act(() => result.current.stopLoading());
  expect(result.current.isLoading).toBe(false);
});

it('startLoading_acepta_mensaje_opcional', () => {
  const { result } = renderHook(() => useLoading());
  act(() => result.current.startLoading('Cargando datos...'));
  expect(result.current.loadingMessage).toBe('Cargando datos...');
});
