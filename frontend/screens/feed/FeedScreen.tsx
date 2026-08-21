import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { FeedEmptyState, FiltroFeedBar, GestosCard, type FiltroFeed } from '@/components/feed';
import { useToast } from '@/hooks/useToast';
import { useFeedStore } from '@/store/feedStore';
import { colors, spacing, typography } from '@/theme';

const CARTAS_A_PRECARGAR = 3;
const CARTAS_APILADAS = 3;
const COINCIDENCIA_DESPENSA_MINIMA = 70;

export function FeedScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [filtro, setFiltro] = useState<FiltroFeed>('para-ti');

  // Medimos la altura real disponible en vez de confiar en que flex:1 se resuelva
  // correctamente en toda la cadena de vistas (stack absoluto + reanimated).
  const [alturaContenedor, setAlturaContenedor] = useState(0);
  const [alturaCabecera, setAlturaCabecera] = useState(0);
  const alturaArea =
    alturaContenedor > 0 && alturaCabecera > 0
      ? Math.max(0, alturaContenedor - alturaCabecera)
      : undefined;
  const estiloArea = alturaArea !== undefined ? { height: alturaArea } : { flex: 1 };

  const recetas = useFeedStore((s) => s.recetas);
  const isLoading = useFeedStore((s) => s.isLoading);
  const isLoadingMas = useFeedStore((s) => s.isLoadingMas);
  const hayMas = useFeedStore((s) => s.hayMas);
  const error = useFeedStore((s) => s.error);
  const cargarFeed = useFeedStore((s) => s.cargarFeed);
  const cargarMas = useFeedStore((s) => s.cargarMas);
  const cargarPerfilGustos = useFeedStore((s) => s.cargarPerfilGustos);
  const guardarReceta = useFeedStore((s) => s.guardarReceta);
  const descartarReceta = useFeedStore((s) => s.descartarReceta);
  const darLike = useFeedStore((s) => s.darLike);

  const indiceActual = 0;

  const recetasMostradas = useMemo(() => {
    if (filtro === 'despensa') {
      return recetas.filter((r) => r.coincidenciaDespensa >= COINCIDENCIA_DESPENSA_MINIMA);
    }
    return recetas;
  }, [filtro, recetas]);

  useEffect(() => {
    cargarFeed();
    cargarPerfilGustos();
  }, []);

  useEffect(() => {
    if (error) {
      showError(error);
      useFeedStore.setState({ error: null });
    }
  }, [error]);

  useEffect(() => {
    const siguientes = recetasMostradas.slice(indiceActual + 1, indiceActual + 1 + CARTAS_A_PRECARGAR);
    siguientes.forEach((r) => {
      if (r.imagenUrl) Image.prefetch(r.imagenUrl);
    });
  }, [indiceActual, recetasMostradas]);

  useEffect(() => {
    if (hayMas && !isLoadingMas && indiceActual >= recetasMostradas.length - 2) {
      cargarMas();
    }
  }, [indiceActual, recetasMostradas.length, hayMas, isLoadingMas]);

  const recetaActual = recetasMostradas[indiceActual];

  const handleGuardar = () => {
    if (!recetaActual) return;
    void guardarReceta(recetaActual.id);
    showSuccess('Receta guardada');
  };

  const handleDescartar = () => {
    if (!recetaActual) return;
    void descartarReceta(recetaActual.id);
  };

  const handleDobleToqueLike = async () => {
    if (!recetaActual || recetaActual.yaLike) return;
    try {
      await darLike(recetaActual.id);
    } catch {
      // Idempotente: si ya tenía like, ignoramos el conflicto sin molestar al usuario
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const cartasVisibles = recetaActual
    ? recetasMostradas.slice(indiceActual, indiceActual + CARTAS_APILADAS)
    : [];

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
      onLayout={(e) => setAlturaContenedor(e.nativeEvent.layout.height)}
    >
      <View onLayout={(e) => setAlturaCabecera(e.nativeEvent.layout.height)}>
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Feed</Text>
          <Pressable
            style={({ pressed }) => [styles.btnBuscar, pressed && styles.btnBuscarPressed]}
            onPress={() => router.push('/social/buscar')}
            hitSlop={8}
            testID="btn-buscar-usuarios"
          >
            <Ionicons name="search" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <FiltroFeedBar filtroActivo={filtro} onFiltroChange={setFiltro} />
      </View>

      {recetaActual ? (
        <View style={[styles.stack, estiloArea]}>
          {cartasVisibles
            .map((receta, posicion) => ({ receta, posicion }))
            .reverse()
            .map(({ receta, posicion }) => (
              <View key={receta.id} style={styles.carta}>
                <GestosCard
                  receta={receta}
                  posicion={posicion}
                  onGuardar={handleGuardar}
                  onDescartar={handleDescartar}
                  onLike={handleDobleToqueLike}
                  onPress={posicion === 0 ? () => router.push(`/feed/${receta.id}`) : undefined}
                  onAutorPress={
                    posicion === 0 ? () => router.push(`/social/perfil/${receta.autorId}`) : undefined
                  }
                />
              </View>
            ))}
        </View>
      ) : (
        <View style={[styles.vacioWrapper, estiloArea]}>
          <FeedEmptyState />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitulo: {
    ...typography.heading1,
    color: colors.text.primary,
  },
  btnBuscar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBuscarPressed: {
    backgroundColor: colors.gray,
  },
  stack: {
    width: '100%',
  },
  carta: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxxl,
  },
  vacioWrapper: {
    width: '100%',
    justifyContent: 'center',
  },
});
