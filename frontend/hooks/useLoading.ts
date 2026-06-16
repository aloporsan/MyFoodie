import { useState } from 'react';

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

  const startLoading = (mensaje?: string) => {
    setIsLoading(true);
    setLoadingMessage(mensaje);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  };

  return { isLoading, loadingMessage, startLoading, stopLoading };
}
