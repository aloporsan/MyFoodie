import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, type GestureType } from 'react-native-gesture-handler';
import { RecetaFeed } from '@/services/feedService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { resolveImagenUrl } from '@/utils/media';

interface RecetaCardProps {
  receta: RecetaFeed;
  autorGesture?: GestureType;
}

const DIFICULTAD_COLOR: Record<string, string> = {
  'fácil': colors.primary,
  media: colors.secondary,
  'difícil': colors.error,
};

const CHIP_AZUL = '#5B8DEF';
const MAXIMO_CHIPS_SOCIALES = 2;

interface ChipSocial {
  key: string;
  texto: string;
  backgroundColor: string;
}

function obtenerChipsSociales(receta: RecetaFeed): ChipSocial[] {
  const contexto = receta.contextoSocial;
  if (!contexto) return [];

  const chips: ChipSocial[] = [];

  if (contexto.publicadaPorSeguido) {
    chips.push({ key: 'publicada', texto: 'Publicado por alguien que sigues', backgroundColor: colors.primary });
  }

  if (contexto.seguidosQueDieronLike.length > 0) {
    const [primero] = contexto.seguidosQueDieronLike;
    const total = receta.likesDeSeguidosCount ?? contexto.seguidosQueDieronLike.length;
    const texto = total > 1 ? `A ${primero} y ${total - 1} más les gusta` : `A ${primero} le gusta`;
    chips.push({ key: 'likes', texto, backgroundColor: CHIP_AZUL });
  }

  if (contexto.compartidaContigo) {
    chips.push({ key: 'compartida', texto: 'Compartida contigo', backgroundColor: colors.secondary });
  }

  return chips.slice(0, MAXIMO_CHIPS_SOCIALES);
}

export function RecetaCard({ receta, autorGesture }: RecetaCardProps) {
  const totalIngredientes = receta.ingredientesDisponibles + receta.ingredientesFaltantes;
  const coincidencia = obtenerCoincidencia(receta.coincidenciaDespensa, receta.ingredientesFaltantes);
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad?.toLowerCase()] ?? colors.grayMid;
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);
  const chipsSociales = obtenerChipsSociales(receta);

  return (
    <View style={styles.container}>
      {imagenUrl ? (
        <Image
          source={{ uri: imagenUrl }}
          style={styles.imagen}
          contentFit="cover"
          recyclingKey={receta.id}
        />
      ) : (
        <View style={[styles.imagen, styles.imagenPlaceholder]}>
          <Ionicons name="restaurant-outline" size={48} color="rgba(255,255,255,0.7)" />
        </View>
      )}

      {chipsSociales.length > 0 && (
        <View style={styles.chipsSocialesRow}>
          {chipsSociales.map((chip) => (
            <View key={chip.key} style={[styles.chipSocial, { backgroundColor: chip.backgroundColor }]}>
              <Text style={styles.chipSocialTexto} numberOfLines={1}>
                {chip.texto}
              </Text>
            </View>
          ))}
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
        <AutorRow receta={receta} gesture={autorGesture} />

        <Text style={styles.titulo} numberOfLines={2}>
          {receta.titulo}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.white} />
            <Text style={styles.metaTexto}>{receta.tiempoEstimado} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={colors.white} />
            <Text style={styles.metaTexto}>{receta.numPersonas} pers.</Text>
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

function AutorRow({ receta, gesture }: { receta: RecetaFeed; gesture?: GestureType }) {
  const contenido = (
    <View style={styles.autorRow} testID="btn-autor">
      {receta.autorFoto ? (
        <Image
          source={{ uri: receta.autorFoto }}
          style={styles.autorFoto}
          contentFit="cover"
          recyclingKey={receta.id}
        />
      ) : (
        <View style={[styles.autorFoto, styles.autorFotoPlaceholder]}>
          <Ionicons name="person" size={14} color={colors.white} />
        </View>
      )}
      <Text style={styles.autorNombre} numberOfLines={1}>
        {receta.autorNombre ?? receta.autorUsuario ?? 'Usuario'}
      </Text>
    </View>
  );

  if (!gesture) return contenido;

  return <GestureDetector gesture={gesture}>{contenido}</GestureDetector>;
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
  chipsSocialesRow: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: 60,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chipSocial: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    maxWidth: '100%',
  },
  chipSocialTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
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
