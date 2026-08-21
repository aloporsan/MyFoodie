import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Notificacion } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';
import { navegarSegunNotificacion } from '@/utils/notificacionesConfig';
import { borderRadius, colors, spacing, typography } from '@/theme';

const ICONO_POR_TIPO: Partial<Record<string, keyof typeof Ionicons.glyphMap>> = {
  nuevo_seguidor: 'person-add',
  solicitud_seguimiento: 'person-add-outline',
  solicitud_aceptada: 'checkmark-circle',
  nuevo_like: 'heart',
  nuevo_comentario: 'chatbubble',
  receta_compartida: 'share-social',
  producto_caduca_hoy: 'alert-circle',
  producto_caduca_pronto: 'time',
  producto_sin_stock: 'cart',
  carrito_actualizado: 'cart',
};

function formatearFechaRelativa(fecha: string): string {
  const diffMs = Date.now() - new Date(fecha).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;
  if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras === 1 ? '' : 's'}`;
  if (diffDias === 1) return 'ayer';
  if (diffDias < 7) return `hace ${diffDias} días`;
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

interface Props {
  notificacion: Notificacion;
}

export function NotificacionItem({ notificacion }: Props) {
  const marcarComoLeida = useNotificacionStore((s) => s.marcarComoLeida);
  const eliminarNotificacion = useNotificacionStore((s) => s.eliminarNotificacion);

  const handlePress = async () => {
    if (!notificacion.leida) {
      try {
        await marcarComoLeida(notificacion.id);
      } catch {
        // El error queda reflejado en el store; la navegación continúa igualmente
      }
    }
    navegarSegunNotificacion({
      tipo: notificacion.tipo,
      emisorId: notificacion.emisor?.id,
      referenciaId: notificacion.referenciaId ?? undefined,
      referenciaType: notificacion.referenciaType ?? undefined,
    });
  };

  const handleEliminar = () => {
    eliminarNotificacion(notificacion.id).catch(() => {});
  };

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          style={styles.eliminarOverlay}
          onPress={handleEliminar}
          testID="btn-eliminar-notificacion"
        >
          <Ionicons name="trash-outline" size={22} color={colors.white} />
        </Pressable>
      )}
      overshootRight={false}
    >
      <Pressable
        style={[styles.container, !notificacion.leida && styles.containerNoLeida]}
        onPress={handlePress}
        testID="notificacion-item"
      >
        {notificacion.emisor ? (
          notificacion.emisor.fotoPerfil ? (
            <Image
              source={{ uri: notificacion.emisor.fotoPerfil }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={18} color={colors.white} />
            </View>
          )
        ) : (
          <View style={[styles.avatar, styles.iconoSistema]}>
            <Ionicons
              name={ICONO_POR_TIPO[notificacion.tipo] ?? 'notifications'}
              size={18}
              color={colors.white}
            />
          </View>
        )}

        <View style={styles.contenido}>
          <Text
            style={[styles.titulo, !notificacion.leida && styles.tituloNoLeida]}
            numberOfLines={2}
          >
            {notificacion.titulo}
          </Text>
          <Text style={styles.cuerpo} numberOfLines={2}>
            {notificacion.cuerpo}
          </Text>
          <Text style={styles.fecha}>{formatearFechaRelativa(notificacion.createdAt)}</Text>
        </View>

        {!notificacion.leida && <View style={styles.puntoNoLeida} testID="punto-no-leida" />}
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  containerNoLeida: {
    backgroundColor: '#F3FAEA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    backgroundColor: colors.grayMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoSistema: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    ...typography.body,
    color: colors.text.primary,
  },
  tituloNoLeida: {
    fontFamily: typography.fontFamily.semiBold,
  },
  cuerpo: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fecha: {
    ...typography.caption,
    color: colors.grayMid,
    marginTop: 2,
  },
  puntoNoLeida: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  eliminarOverlay: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
});
