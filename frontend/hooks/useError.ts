import { useState } from 'react';

export function useError() {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = (mensaje: string) => setErrorState(mensaje);
  const clearError = () => setErrorState(null);
  const hasError = error !== null;

  return { error, hasError, setError, clearError };
}
