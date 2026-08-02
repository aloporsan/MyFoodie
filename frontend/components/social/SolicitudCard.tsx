import { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

export interface SolicitudCardData {
  id: string;
  usuarioId: string;
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
}

interface Props {
  solicitud: SolicitudCardData;
  onAceptar: () => void;
  onRechazar: () => void;
}

export function SolicitudCard({ solicitud, onAceptar, onRechazar }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  const iniciales = solicitud.nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const desaparecer = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleAceptar = () => {
    desaparecer();
    onAceptar();
  };

  const handleRechazar = () => {
    desaparecer();
    onRechazar();
  };

  return (
    <Animated.View style={[styles.container, { opacity }]} testID="solicitud-card">
      <View style={styles.fotoWrapper}>
        {solicitud.fotoPerfil ? (
          <Image source={{ uri: solicitud.fotoPerfil }} style={styles.foto} />
        ) : (
          <View style={styles.fotoPlaceholder}>
            <Text style={styles.iniciales}>{iniciales}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {solicitud.nombre}
        </Text>
        <Text style={styles.nombreUsuario} numberOfLines={1}>
          @{solicitud.nombreUsuario}
        </Text>
      </View>

      <View style={styles.acciones}>
        <Pressable
          style={[styles.boton, styles.botonAceptar]}
          onPress={handleAceptar}
          hitSlop={8}
          testID="btn-aceptar"
        >
          <Text style={styles.labelAceptar}>Aceptar</Text>
        </Pressable>
        <Pressable
          style={[styles.boton, styles.botonRechazar]}
          onPress={handleRechazar}
          hitSlop={8}
          testID="btn-rechazar"
        >
          <Text style={styles.labelRechazar}>Rechazar</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  fotoWrapper: {
    flexShrink: 0,
  },
  foto: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  fotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: {
    ...typography.label,
    color: colors.white,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    ...typography.label,
    color: colors.text.primary,
  },
  nombreUsuario: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  acciones: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
  boton: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAceptar: {
    backgroundColor: colors.primary,
  },
  labelAceptar: {
    ...typography.caption,
    fontFamily: typography.label.fontFamily,
    color: colors.white,
  },
  botonRechazar: {
    backgroundColor: colors.grayLight,
  },
  labelRechazar: {
    ...typography.caption,
    fontFamily: typography.label.fontFamily,
    color: colors.grayDark,
  },
});
