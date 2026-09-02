import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Receta } from '@/services/recetaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { resolveImagenUrl } from '@/utils/media';

const DIFICULTAD_COLOR: Record<string, string> = {
  Fácil: colors.primary,
  Media: colors.secondary,
  Difícil: colors.error,
};

interface Props {
  receta: Receta;
  onPress: () => void;
}

/** Tarjeta de receta con imagen arriba y meta debajo. Reutilizada en listados de recetas de usuario. */
export function RecetaCardVertical({ receta, onPress }: Props) {
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad] ?? colors.grayMid;
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {imagenUrl ? (
        <Image source={{ uri: imagenUrl }} style={styles.imagen} resizeMode="cover" />
      ) : (
        <View style={[styles.imagen, styles.imagenPlaceholder]}>
          <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.7)" />
        </View>
      )}
      {!!receta.dificultad && (
        <View style={[styles.dificultadBadge, { backgroundColor: dificultadColor }]}>
          <Text style={styles.dificultadTexto}>{receta.dificultad}</Text>
        </View>
      )}
      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>{receta.titulo}</Text>
        <Text style={styles.descripcion} numberOfLines={2}>{receta.descripcion}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
            <Text style={styles.metaTexto}>{receta.tiempoEstimado} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="heart-outline" size={13} color={colors.text.secondary} />
            <Text style={styles.metaTexto}>{receta.totalLikes ?? 0}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imagen: { width: '100%', height: 140 },
  imagenPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dificultadBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  dificultadTexto: { ...typography.caption, color: colors.white, fontWeight: '700' },
  cuerpo: { padding: spacing.lg, gap: spacing.sm },
  titulo: { ...typography.heading3, color: colors.text.primary },
  descripcion: { ...typography.body, color: colors.text.secondary },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaTexto: { ...typography.caption, color: colors.text.secondary },
});
