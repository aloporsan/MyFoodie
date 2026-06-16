import { handleApiError } from '@/utils/errorHandler';

it('mapea_400_a_mensaje_datos_incorrectos', () => {
  expect(handleApiError({ response: { status: 400 } })).toBe('Los datos introducidos no son correctos');
});

it('mapea_401_a_sesion_expirada', () => {
  expect(handleApiError({ response: { status: 401 } })).toBe('Tu sesión ha expirado, inicia sesión de nuevo');
});

it('mapea_403_a_sin_permiso', () => {
  expect(handleApiError({ response: { status: 403 } })).toBe('No tienes permiso para realizar esta acción');
});

it('mapea_404_a_no_encontrado', () => {
  expect(handleApiError({ response: { status: 404 } })).toBe('No se ha encontrado lo que buscabas');
});

it('mapea_409_a_registro_duplicado', () => {
  expect(handleApiError({ response: { status: 409 } })).toBe('Ya existe un registro con estos datos');
});

it('mapea_500_a_error_servidor', () => {
  expect(handleApiError({ response: { status: 500 } })).toBe('Ha ocurrido un error en el servidor, inténtalo más tarde');
});

it('mapea_error_de_red_ERR_NETWORK', () => {
  expect(handleApiError({ code: 'ERR_NETWORK' })).toBe('Comprueba tu conexión a internet e inténtalo de nuevo');
});

it('retorna_mensaje_generico_para_error_desconocido', () => {
  expect(handleApiError(null)).toBe('Ha ocurrido un error inesperado');
  expect(handleApiError(undefined)).toBe('Ha ocurrido un error inesperado');
  expect(handleApiError({ response: { status: 999 } })).toBe('Ha ocurrido un error inesperado');
});
