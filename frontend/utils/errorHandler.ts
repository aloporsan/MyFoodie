export function handleApiError(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'Ha ocurrido un error inesperado';
  }

  const err = error as Record<string, unknown>;

  if (err.response && typeof err.response === 'object') {
    const res = err.response as Record<string, unknown>;
    if (typeof res.status === 'number') {
      const map: Record<number, string> = {
        400: 'Los datos introducidos no son correctos',
        401: 'Tu sesión ha expirado, inicia sesión de nuevo',
        403: 'No tienes permiso para realizar esta acción',
        404: 'No se ha encontrado lo que buscabas',
        409: 'Ya existe un registro con estos datos',
        500: 'Ha ocurrido un error en el servidor, inténtalo más tarde',
      };
      return map[res.status] ?? 'Ha ocurrido un error inesperado';
    }
  }

  if (err.code === 'ERR_NETWORK' || (error instanceof Error && error.message === 'Network Error')) {
    return 'Comprueba tu conexión a internet e inténtalo de nuevo';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado';
}
