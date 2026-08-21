import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ModalRecetaRealizada } from '@/components/receta';
import { showConfirm } from '@/hooks/useConfirm';
import { Receta } from '@/services/recetaService';
import { useRecetaStore } from '@/store/recetaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { resolveImagenUrl } from '@/utils/media';

const UMBRAL_SWIPE = 80;

const DIFICULTAD_COLOR: Record<string, string> = {
  Fácil: colors.primary,
  Media: colors.secondary,
  Difícil: colors.error,
};

export function RecetasGuardadasScreen() {
  const router = useRouter();
  const recetasGuardadas = useRecetaStore((s) => s.recetasGuardadas);
  const cargarRecetasGuardadas = useRecetaStore((s) => s.cargarRecetasGuardadas);
  const eliminarGuardado = useRecetaStore((s) => s.eliminarGuardado);
  const [refreshing, setRefreshing] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [recetaRealizada, setRecetaRealizada] = useState<Receta | null>(null);

  useEffect(() => {
    cargarRecetasGuardadas().finally(() => setCargandoInicial(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarRecetasGuardadas();
    setRefreshing(false);
  };

  const confirmarQuitarGuardado = (id: string, titulo: string) => {
    showConfirm(
      'Quitar de guardados',
      `¿Quitar "${titulo}" de tus recetas guardadas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => eliminarGuardado(id),
        },
      ],
      { icon: 'bookmark-outline' }
    );
  };

  if (cargandoInicial) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Recetas guardadas</Text>
        <View style={styles.headerRight}>
          {recetasGuardadas.length > 0 && (
            <View style={styles.contador}>
              <Text style={styles.contadorTexto}>{recetasGuardadas.length}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={recetasGuardadas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={recetasGuardadas.length === 0 ? styles.centrado : styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyIcono}>
              <Ionicons name="bookmark-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitulo}>Aún no has guardado ninguna receta</Text>
            <Pressable
              style={styles.explorarBtn}
              onPress={() => router.push('/(tabs)/feed')}
            >
              <Ionicons name="compass-outline" size={18} color={colors.white} />
              <Text style={styles.explorarBtnTexto}>Explorar recetas</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <RecetaCard
            receta={item}
            onPress={() => router.push({ pathname: '/receta/[id]', params: { id: item.id } })}
            onQuitarGuardado={() => confirmarQuitarGuardado(item.id, item.titulo)}
            onMarcarRealizada={() => setRecetaRealizada(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />

      {recetaRealizada && (
        <ModalRecetaRealizada
          visible={recetaRealizada !== null}
          recetaId={recetaRealizada.id}
          numPersonas={recetaRealizada.numPersonas}
          onClose={() => setRecetaRealizada(null)}
        />
      )}
    </SafeAreaView>
  );
}

function RecetaCard({
  receta,
  onPress,
  onQuitarGuardado,
  onMarcarRealizada,
}: {
  receta: Receta;
  onPress: () => void;
  onQuitarGuardado: () => void;
  onMarcarRealizada: () => void;
}) {
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad] ?? colors.grayMid;
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);

  const translateX = useSharedValue(0);

  // activeOffsetX deja pasar el gesto vertical al ScrollView/FlatList mientras no
  // haya un desplazamiento horizontal claro (evita robar el scroll de la lista).
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      translateX.value = withSpring(0);
      if (event.translationX > UMBRAL_SWIPE) {
        runOnJS(onMarcarRealizada)();
      } else if (event.translationX < -UMBRAL_SWIPE) {
        runOnJS(onQuitarGuardado)();
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayRealizadaStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  const overlayEliminarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(-translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={cardAnimStyle}>
        <View style={cardStyles.container}>
          <Pressable onPress={onPress}>
            {imagenUrl ? (
              <Image
                source={{ uri: imagenUrl }}
                style={cardStyles.imagen}
                resizeMode="cover"
              />
            ) : (
              <View style={[cardStyles.imagen, cardStyles.imagenPlaceholder]}>
                <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.7)" />
              </View>
            )}
            <View style={[cardStyles.dificultadBadge, { backgroundColor: dificultadColor }]}>
              <Text style={cardStyles.dificultadTexto}>{receta.dificultad}</Text>
            </View>
            <View style={cardStyles.cuerpo}>
              <Text style={cardStyles.titulo} numberOfLines={2}>{receta.titulo}</Text>
              <Text style={cardStyles.descripcion} numberOfLines={2}>{receta.descripcion}</Text>
              <View style={cardStyles.metaRow}>
                <View style={cardStyles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
                  <Text style={cardStyles.metaTexto}>{receta.tiempoEstimado} min</Text>
                </View>
                <View style={cardStyles.metaItem}>
                  <Ionicons name="heart-outline" size={13} color={colors.text.secondary} />
                  <Text style={cardStyles.metaTexto}>{receta.totalLikes ?? 0}</Text>
                </View>
              </View>
            </View>
          </Pressable>

          <View style={cardStyles.footer}>
            <Ionicons name="chevron-back" size={14} color={colors.error} />
            <Text style={cardStyles.swipeHintTextEliminar}>Eliminar</Text>
            <Text style={cardStyles.swipeHintDivider}>·</Text>
            <Text style={cardStyles.swipeHintTextRealizada}>Realizada</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
          </View>

          <Animated.View
            testID="overlay-realizada-guardada"
            style={[cardStyles.overlay, cardStyles.overlayRealizada, overlayRealizadaStyle]}
            pointerEvents="none"
          >
            <Ionicons name="restaurant" size={40} color={colors.white} />
          </Animated.View>

          <Animated.View
            testID="overlay-eliminar-guardada"
            style={[cardStyles.overlay, cardStyles.overlayEliminar, overlayEliminarStyle]}
            pointerEvents="none"
          >
            <Ionicons name="trash-outline" size={40} color={colors.white} />
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { ...typography.heading3, color: colors.text.primary },
  headerRight: { width: 40, alignItems: 'flex-end' },
  contador: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  contadorTexto: { ...typography.caption, color: colors.white, fontWeight: '700' },
  lista: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyWrapper: { alignItems: 'center', gap: spacing.md },
  emptyIcono: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
  explorarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  explorarBtnTexto: { ...typography.label, color: colors.white, fontWeight: '700' },
});

const cardStyles = StyleSheet.create({
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  swipeHintTextEliminar: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  swipeHintTextRealizada: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  swipeHintDivider: {
    ...typography.caption,
    color: colors.text.secondary,
    marginHorizontal: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayRealizada: {
    backgroundColor: 'rgba(127, 198, 42, 0.75)',
  },
  overlayEliminar: {
    backgroundColor: 'rgba(229, 57, 53, 0.75)',
  },
});
