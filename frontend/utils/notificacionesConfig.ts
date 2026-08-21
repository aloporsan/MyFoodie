import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificacionService } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function solicitarPermisosYRegistrarToken(): Promise<void> {
  const { status: estadoActual } = await Notifications.getPermissionsAsync();
  let estadoFinal = estadoActual;

  if (estadoActual !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    estadoFinal = status;
  }

  if (estadoFinal !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await notificacionService.registrarPushToken(token);
  } catch {
    // Sin token de push disponible (p. ej. emulador): las notificaciones in-app siguen funcionando
  }
}

type DatosNotificacion = {
  tipo?: string;
  emisorId?: string;
  referenciaId?: string;
  referenciaType?: string;
};

function navegarSegunNotificacion(datos: DatosNotificacion): void {
  const { tipo, emisorId, referenciaId } = datos;

  switch (tipo) {
    case 'nuevo_seguidor':
    case 'solicitud_seguimiento':
    case 'solicitud_aceptada':
      if (emisorId) {
        router.push({ pathname: '/social/perfil/[id]', params: { id: emisorId } });
      }
      break;
    case 'nuevo_like':
    case 'nuevo_comentario':
      if (referenciaId) {
        router.push({ pathname: '/receta/[id]', params: { id: referenciaId } });
      }
      break;
    case 'receta_compartida':
      router.push('/compartir/recibidas');
      break;
    case 'producto_caduca_hoy':
      router.push({ pathname: '/despensa/filtrada', params: { filtro: 'caduca_hoy' } });
      break;
    case 'producto_caduca_pronto':
      router.push({ pathname: '/despensa/filtrada', params: { filtro: 'caduca_pronto' } });
      break;
    case 'producto_sin_stock':
      router.push({ pathname: '/despensa/filtrada', params: { filtro: 'sin_stock' } });
      break;
    case 'carrito_actualizado':
      router.push('/carrito');
      break;
    default:
      break;
  }
}

export function configurarListeners(): () => void {
  const suscripcionRecibida = Notifications.addNotificationReceivedListener(() => {
    useNotificacionStore.getState().cargarContador();
  });

  const suscripcionRespuesta = Notifications.addNotificationResponseReceivedListener((respuesta) => {
    const datos = respuesta.notification.request.content.data as DatosNotificacion;
    navegarSegunNotificacion(datos);
  });

  return () => {
    suscripcionRecibida.remove();
    suscripcionRespuesta.remove();
  };
}
