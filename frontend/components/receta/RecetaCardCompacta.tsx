import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { resolveImagenUrl } from '@/utils/media';

const UMBRAL_SWIPE = 80;

const DIFICULTAD_COLOR: Record<string, string> = {
  'fácil': colors.primary,
  media: colors.secondary,
  'difícil': colors.error,
};

/** Datos mínimos que sirve cualquier receta (RecetaFeed o Receta) para pintar la tarjeta. */
export interface RecetaCardDatos {
  titulo: string;
  imagenUrl?: string;
  dificultad: string;
  tiempoEstimado: number;
  categoria?: string;
  numPersonas?: number;
}

interface SwipeAccion {
  icono: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onAction: () => void;
}

interface Props {
  receta: RecetaCardDatos;
  onPress: () => void;
  /** Descripción en 2 líneas bajo el título (recetas guardadas / publicadas). */
  descripcion?: string;
  /** Nº de likes: se muestra como último ítem de la fila meta. */
  likes?: number;
  /** Estado de la despensa para esta receta (solo en el buscador). */
  despensa?: { disponibles: number; faltantes: number };
  /** Pastilla de estado sobre la miniatura (recetas publicadas). */
  estadoBadge?: 'publicada' | 'borrador';
  /** Botón "Editar" en un pie de la tarjeta (recetas publicadas). */
  onEditar?: () => void;
  /** Acciones por deslizamiento izquierda/derecha (recetas guardadas). */
  swipe?: { izquierda: SwipeAccion; derecha: SwipeAccion };
  testID?: string;
}

function estadoDespensa(d: { disponibles: number; faltantes: number }) {
  const total = d.disponibles + d.faltantes;
  if (total === 0) return null;
  if (d.faltantes === 0) {
    return { color: colors.primary, icono: 'checkmark-circle' as const, texto: 'Tienes los ingredientes' };
  }
  if (d.disponibles > 0) {
    return {
      color: colors.secondary,
      icono: 'remove-circle' as const,
      texto: `Tienes ${d.disponibles}/${total}`,
    };
  }
  return { color: colors.grayMid, icono: 'close-circle' as const, texto: 'Te faltan ingredientes' };
}

/**
 * Tarjeta compacta de receta (miniatura + meta), unificada entre el buscador, las recetas
 * guardadas y "mis recetas". Las variantes se activan por props opcionales en vez de tener
 * una copia distinta en cada pantalla.
 */
export function RecetaCardCompacta({
  receta,
  onPress,
  descripcion,
  likes,
  despensa,
  estadoBadge,
  onEditar,
  swipe,
  testID,
}: Props) {
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad?.toLowerCase()] ?? colors.grayMid;
  const estado = despensa ? estadoDespensa(despensa) : null;

  const contenido = (
    <>
      <Pressable style={styles.card} onPress={onPress} testID={testID}>
        <View>
          {imagenUrl ? (
            <Image source={{ uri: imagenUrl }} style={styles.imagen} contentFit="cover" />
          ) : (
            <View style={[styles.imagen, styles.imagenPlaceholder]}>
              <Ionicons name="restaurant-outline" size={24} color={colors.white} />
            </View>
          )}
          {estadoBadge && (
            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: estadoBadge === 'publicada' ? colors.primary : colors.grayMid },
              ]}
            >
              <Text style={styles.estadoTexto}>
                {estadoBadge === 'publicada' ? 'Publicada' : 'Borrador'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cuerpo}>
          <Text style={styles.titulo} numberOfLines={1}>
            {receta.titulo}
          </Text>

          {descripcion ? (
            <Text style={styles.descripcion} numberOfLines={2}>
              {descripcion}
            </Text>
          ) : null}

          <View style={styles.metaFila}>
            <View style={[styles.pill, { backgroundColor: dificultadColor }]}>
              <Text style={styles.pillTexto}>{receta.dificultad}</Text>
            </View>
            {receta.categoria && (
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={13} color={colors.text.secondary} />
                <Text style={styles.metaTexto}>{receta.categoria}</Text>
              </View>
            )}
            {receta.numPersonas != null && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color={colors.text.secondary} />
                <Text style={styles.metaTexto}>{receta.numPersonas}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
              <Text style={styles.metaTexto}>{receta.tiempoEstimado} min</Text>
            </View>
            {likes != null && (
              <View style={styles.metaItem}>
                <Ionicons name="heart-outline" size={13} color={colors.text.secondary} />
                <Text style={styles.metaTexto}>{likes}</Text>
              </View>
            )}
          </View>

          {estado && (
            <View style={styles.despensaFila}>
              <Ionicons name={estado.icono} size={14} color={estado.color} />
              <Text style={[styles.despensaTexto, { color: estado.color }]}>{estado.texto}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {onEditar && (
        <Pressable style={styles.editarBtn} onPress={onEditar} hitSlop={8}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
          <Text style={styles.editarTexto}>Editar</Text>
        </Pressable>
      )}
    </>
  );

  if (!swipe) {
    return <View style={styles.contenedor}>{contenido}</View>;
  }

  return <TarjetaDeslizable swipe={swipe}>{contenido}</TarjetaDeslizable>;
}

function TarjetaDeslizable({
  swipe,
  children,
}: {
  swipe: NonNullable<Props['swipe']>;
  children: React.ReactNode;
}) {
  const translateX = useSharedValue(0);

  // activeOffsetX deja pasar el gesto vertical a la lista mientras no haya un desplazamiento
  // horizontal claro (no roba el scroll).
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      translateX.value = withSpring(0);
      if (event.translationX > UMBRAL_SWIPE) {
        runOnJS(swipe.derecha.onAction)();
      } else if (event.translationX < -UMBRAL_SWIPE) {
        runOnJS(swipe.izquierda.onAction)();
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayDerechaStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  const overlayIzquierdaStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(-translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.contenedor, cardAnimStyle]}>
        {children}

        <View style={styles.swipeHint}>
          <Ionicons name="chevron-back" size={14} color={swipe.izquierda.color} />
          <Text style={[styles.swipeHintTexto, { color: swipe.izquierda.color }]}>
            {swipe.izquierda.label}
          </Text>
          <Text style={styles.swipeHintDivisor}>·</Text>
          <Text style={[styles.swipeHintTexto, { color: swipe.derecha.color }]}>
            {swipe.derecha.label}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={swipe.derecha.color} />
        </View>

        <Animated.View
          testID="overlay-swipe-derecha"
          style={[styles.overlay, { backgroundColor: swipe.derecha.color + 'BF' }, overlayDerechaStyle]}
          pointerEvents="none"
        >
          <Ionicons name={swipe.derecha.icono} size={36} color={colors.white} />
        </Animated.View>

        <Animated.View
          testID="overlay-swipe-izquierda"
          style={[styles.overlay, { backgroundColor: swipe.izquierda.color + 'BF' }, overlayIzquierdaStyle]}
          pointerEvents="none"
        >
          <Ionicons name={swipe.izquierda.icono} size={36} color={colors.white} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  imagen: { width: 80, height: 80, borderRadius: borderRadius.md },
  imagenPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  estadoTexto: { ...typography.caption, fontSize: 9, color: colors.white, fontWeight: '700' },
  cuerpo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  titulo: { ...typography.label, color: colors.text.primary, fontWeight: '700' },
  descripcion: { ...typography.caption, color: colors.text.secondary },
  metaFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  pillTexto: { ...typography.caption, fontSize: 10, color: colors.white, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTexto: { ...typography.caption, color: colors.text.secondary },
  despensaFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  despensaTexto: { ...typography.caption, fontWeight: '600' },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  editarTexto: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    paddingVertical: spacing.sm,
  },
  swipeHintTexto: { ...typography.caption, fontWeight: '600' },
  swipeHintDivisor: { ...typography.caption, color: colors.text.secondary, marginHorizontal: 2 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
