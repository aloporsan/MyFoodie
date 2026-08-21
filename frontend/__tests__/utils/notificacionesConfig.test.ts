jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

import { navegarSegunNotificacion } from '@/utils/notificacionesConfig';

const { router } = require('expo-router');
const mockPush = router.push as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it('nuevo_seguidor_navega_al_perfil_del_emisor', () => {
  navegarSegunNotificacion({ tipo: 'nuevo_seguidor', emisorId: 'emisor-1' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/social/perfil/[id]', params: { id: 'emisor-1' } });
});

it('solicitud_seguimiento_navega_al_perfil_del_emisor', () => {
  navegarSegunNotificacion({ tipo: 'solicitud_seguimiento', emisorId: 'emisor-1' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/social/perfil/[id]', params: { id: 'emisor-1' } });
});

it('solicitud_aceptada_navega_al_perfil_del_emisor', () => {
  navegarSegunNotificacion({ tipo: 'solicitud_aceptada', emisorId: 'emisor-1' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/social/perfil/[id]', params: { id: 'emisor-1' } });
});

it('nuevo_seguidor_no_navega_si_falta_el_emisorId', () => {
  navegarSegunNotificacion({ tipo: 'nuevo_seguidor' });
  expect(mockPush).not.toHaveBeenCalled();
});

it('nuevo_like_navega_a_la_receta_referenciada', () => {
  navegarSegunNotificacion({ tipo: 'nuevo_like', referenciaId: 'receta-1' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/receta/[id]', params: { id: 'receta-1' } });
});

it('receta_compartida_navega_a_recibidas', () => {
  navegarSegunNotificacion({ tipo: 'receta_compartida' });
  expect(mockPush).toHaveBeenCalledWith('/compartir/recibidas');
});

it('producto_caduca_hoy_navega_a_despensa_filtrada', () => {
  navegarSegunNotificacion({ tipo: 'producto_caduca_hoy' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/despensa/filtrada', params: { filtro: 'caduca_hoy' } });
});

it('producto_caduca_pronto_navega_a_despensa_filtrada', () => {
  navegarSegunNotificacion({ tipo: 'producto_caduca_pronto' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/despensa/filtrada', params: { filtro: 'caduca_pronto' } });
});

it('producto_sin_stock_navega_a_despensa_filtrada', () => {
  navegarSegunNotificacion({ tipo: 'producto_sin_stock' });
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/despensa/filtrada', params: { filtro: 'sin_stock' } });
});

it('carrito_actualizado_navega_al_carrito', () => {
  navegarSegunNotificacion({ tipo: 'carrito_actualizado' });
  expect(mockPush).toHaveBeenCalledWith('/carrito');
});

it('tipo_desconocido_no_navega', () => {
  navegarSegunNotificacion({ tipo: 'tipo_inexistente' });
  expect(mockPush).not.toHaveBeenCalled();
});
