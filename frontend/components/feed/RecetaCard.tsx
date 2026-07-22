import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { RecetaFeed } from '@/services/feedService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface RecetaCardProps {
  receta: RecetaFeed;
}

const DIFICULTAD_COLOR: Record<string, string> = {
  'fácil': colors.primary,
  medio: colors.secondary,
  'difícil': colors.error,
};

export function RecetaCard({ receta }: RecetaCardProps) {
  const totalIngredientes = receta.ingredientesDisponibles + receta.ingredientesFaltantes;
  const coincidencia = obtenerCoincidencia(receta.coincidenciaDespensa, receta.ingredientesFaltantes);
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad?.toLowerCase()] ?? colors.grayMid;

  return (
    <View style={styles.container}>
      {receta.imagenUrl ? (
        <Image source={{ uri: receta.imagenUrl }} style={styles.imagen} contentFit="cover" />
      ) : (
        <View style={[styles.imagen, styles.imagenPlaceholder]}>
          <Ionicons name="restaurant-outline" size={48} color="rgba(255,255,255,0.7)" />
        </View>
      )}

      <View style={styles.likesBadge}>
        <Ionicons name="heart" size={16} color={colors.white} />
        <Text style={styles.likesTexto}>{receta.likes}</Text>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.contenido}>
        <View style={styles.autorRow}>
          {receta.autorFoto ? (
            <Image source={{ uri: receta.autorFoto }} style={styles.autorFoto} contentFit="cover" />
          ) : (
            <View style={[styles.autorFoto, styles.autorFotoPlaceholder]}>
              <Ionicons name="person" size={14} color={colors.white} />
            </View>
          )}
          <Text style={styles.autorNombre} numberOfLines={1}>
            {receta.autorNombre ?? receta.autorUsuario ?? 'Usuario'}
          </Text>
        </View>

        <Text style={styles.titulo} numberOfLines={2}>
          {receta.titulo}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.white} />
            <Text style={styles.metaTexto}>{receta.tiempoEstimado} min</Text>
          </View>
          <View style={[styles.dificultadBadge, { backgroundColor: dificultadColor }]}>
            <Text style={styles.dificultadTexto}>{receta.dificultad}</Text>
          </View>
        </View>

        {receta.etiquetas.length > 0 && (
          <View style={styles.etiquetasRow}>
            {receta.etiquetas.map((etiqueta) => (
              <View key={etiqueta} style={styles.etiquetaChip}>
                <Text style={styles.etiquetaTexto}>{etiqueta}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.coincidenciaBar}>
          <Text style={styles.coincidenciaTexto}>
            Tienes {receta.ingredientesDisponibles} de {totalIngredientes} ingredientes
          </Text>
          <Text style={[styles.coincidenciaMensaje, { color: coincidencia.color }]}>
            {coincidencia.mensaje}
          </Text>
        </View>
      </View>
    </View>
  );
}

function obtenerCoincidencia(porcentaje: number, faltantes: number) {
  if (porcentaje >= 80) {
    return { color: colors.primary, mensaje: '¡Puedes preparar esta receta!' };
  }
  if (porcentaje >= 50) {
    return { color: colors.secondary, mensaje: `Te faltan ${faltantes} ingredientes` };
  }
  return { color: colors.grayMid, mensaje: `Te faltan ${faltantes} ingredientes` };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.grayDark,
  },
  imagen: {
    ...StyleSheet.absoluteFillObject,
  },
  imagenPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  likesBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  likesTexto: {
    ...typography.label,
    color: colors.white,
    fontWeight: '700',
  },
  contenido: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  autorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autorFoto: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
  },
  autorFotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  autorNombre: {
    ...typography.label,
    color: colors.white,
    flexShrink: 1,
  },
  titulo: {
    ...typography.heading1,
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaTexto: {
    ...typography.body,
    color: colors.white,
  },
  dificultadBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  dificultadTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  etiquetasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  etiquetaChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  etiquetaTexto: {
    ...typography.caption,
    color: colors.white,
  },
  coincidenciaBar: {
    marginTop: spacing.sm,
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  coincidenciaTexto: {
    ...typography.caption,
    color: colors.white,
  },
  coincidenciaMensaje: {
    ...typography.label,
    fontWeight: '700',
  },
});
