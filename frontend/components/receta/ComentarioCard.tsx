import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Comentario } from '@/services/comentarioService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatearFechaRelativa } from '@/utils/fecha';

interface Props {
  comentario: Comentario;
  onEliminar?: (comentario: Comentario) => void;
}

export function ComentarioCard({ comentario, onEliminar }: Props) {
  const nombre = comentario.nombreUsuario ?? 'Usuario';
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.container} testID="comentario-card">
      <View style={styles.avatarWrapper}>
        {comentario.avatarUsuario ? (
          <Image source={{ uri: comentario.avatarUsuario }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.inicial}>{inicial}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.cabecera}>
          <Text style={styles.nombre} numberOfLines={1}>
            @{nombre}
          </Text>
          <Text style={styles.fecha}>{formatearFechaRelativa(comentario.createdAt)}</Text>
        </View>
        <Text style={styles.texto}>{comentario.texto}</Text>
      </View>

      {comentario.esAutor && onEliminar && (
        <Pressable
          style={styles.eliminar}
          onPress={() => onEliminar(comentario)}
          hitSlop={8}
          testID="btn-eliminar-comentario"
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  avatarWrapper: { flexShrink: 0 },
  avatar: { width: 36, height: 36, borderRadius: borderRadius.full },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicial: { ...typography.caption, color: colors.white },
  info: { flex: 1, gap: 2 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nombre: { ...typography.label, color: colors.text.primary, flexShrink: 1 },
  fecha: { ...typography.caption, color: colors.grayMid },
  texto: { ...typography.body, color: colors.text.primary },
  eliminar: { flexShrink: 0, padding: spacing.xs },
});
