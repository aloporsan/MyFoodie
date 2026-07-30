import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

export interface UsuarioCardData {
  id: string;
  nombre: string;
  nombreUsuario: string;
  fotoPerfil: string | null;
  numRecetas?: number;
  esSeguido: boolean;
  haSolicitado: boolean;
  estaBloqueado?: boolean;
}

interface Props {
  usuario: UsuarioCardData;
  onPress?: () => void;
  onSeguir?: () => void;
}

type EstadoBoton = 'seguir' | 'siguiendo' | 'pendiente' | 'bloqueado';

const LABEL_POR_ESTADO: Record<EstadoBoton, string> = {
  seguir: 'Seguir',
  siguiendo: 'Siguiendo',
  pendiente: 'Pendiente',
  bloqueado: 'Bloqueado',
};

function calcularEstado(usuario: UsuarioCardData): EstadoBoton {
  if (usuario.estaBloqueado) return 'bloqueado';
  if (usuario.esSeguido) return 'siguiendo';
  if (usuario.haSolicitado) return 'pendiente';
  return 'seguir';
}

export function UsuarioCard({ usuario, onPress, onSeguir }: Props) {
  const iniciales = usuario.nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const estado = calcularEstado(usuario);

  const botonEstiloPorEstado: Record<EstadoBoton, object> = {
    seguir: styles.botonSeguir,
    siguiendo: styles.botonSiguiendo,
    pendiente: styles.botonPendiente,
    bloqueado: styles.botonBloqueado,
  };

  const labelEstiloPorEstado: Record<EstadoBoton, object> = {
    seguir: styles.labelSeguir,
    siguiendo: styles.labelSiguiendo,
    pendiente: styles.labelPendiente,
    bloqueado: styles.labelBloqueado,
  };

  return (
    <Pressable style={styles.container} onPress={onPress} testID="usuario-card">
      <View style={styles.fotoWrapper}>
        {usuario.fotoPerfil ? (
          <Image source={{ uri: usuario.fotoPerfil }} style={styles.foto} />
        ) : (
          <View style={styles.fotoPlaceholder}>
            <Text style={styles.iniciales}>{iniciales}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {usuario.nombre}
        </Text>
        <Text style={styles.nombreUsuario} numberOfLines={1}>
          @{usuario.nombreUsuario}
        </Text>
        {usuario.numRecetas !== undefined && (
          <Text style={styles.numRecetas}>
            {usuario.numRecetas} {usuario.numRecetas === 1 ? 'receta' : 'recetas'}
          </Text>
        )}
      </View>

      {onSeguir && (
        <Pressable
          style={[styles.boton, botonEstiloPorEstado[estado]]}
          onPress={onSeguir}
          disabled={estado === 'bloqueado'}
          hitSlop={8}
          testID="btn-accion"
        >
          <Text style={[styles.botonLabel, labelEstiloPorEstado[estado]]}>
            {LABEL_POR_ESTADO[estado]}
          </Text>
        </Pressable>
      )}
    </Pressable>
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
  numRecetas: {
    ...typography.caption,
    color: colors.grayMid,
  },
  boton: {
    flexShrink: 0,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonLabel: {
    ...typography.caption,
    fontFamily: typography.label.fontFamily,
  },
  botonSeguir: {
    backgroundColor: colors.primary,
  },
  labelSeguir: {
    color: colors.white,
  },
  botonSiguiendo: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  labelSiguiendo: {
    color: colors.primary,
  },
  botonPendiente: {
    backgroundColor: colors.grayLight,
  },
  labelPendiente: {
    color: colors.grayDark,
  },
  botonBloqueado: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
  },
  labelBloqueado: {
    color: colors.error,
  },
});
