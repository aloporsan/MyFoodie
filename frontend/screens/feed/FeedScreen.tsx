import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { FeedEmptyState, GestosCard, RecetaCard } from '@/components/feed';
import { useToast } from '@/hooks/useToast';
import { useFeedStore } from '@/store/feedStore';
import { colors, spacing, typography } from '@/theme';

const CARTAS_A_PRECARGAR = 3;

export function FeedScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const recetas = useFeedStore((s) => s.recetas);
  const isLoading = useFeedStore((s) => s.isLoading);
  const isLoadingMas = useFeedStore((s) => s.isLoadingMas);
  const hayMas = useFeedStore((s) => s.hayMas);
  const cargarFeed = useFeedStore((s) => s.cargarFeed);
  const cargarMas = useFeedStore((s) => s.cargarMas);
  const guardarReceta = useFeedStore((s) => s.guardarReceta);
  const descartarReceta = useFeedStore((s) => s.descartarReceta);
  const darLike = useFeedStore((s) => s.darLike);

  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    cargarFeed();
  }, []);

  useEffect(() => {
    const siguientes = recetas.slice(indiceActual + 1, indiceActual + 1 + CARTAS_A_PRECARGAR);
    siguientes.forEach((r) => {
      if (r.imagenUrl) Image.prefetch(r.imagenUrl);
    });
  }, [indiceActual, recetas]);

  useEffect(() => {
    if (hayMas && !isLoadingMas && indiceActual >= recetas.length - 2) {
      cargarMas();
    }
  }, [indiceActual, recetas.length, hayMas, isLoadingMas]);

  const recetaActual = recetas[indiceActual];

  const handleGuardar = async () => {
    if (!recetaActual) return;
    try {
      await guardarReceta(recetaActual.id);
      showSuccess('Receta guardada');
      setIndiceActual((i) => i + 1);
    } catch {
      showError('No se pudo guardar la receta');
    }
  };

  const handleDescartar = async () => {
    if (!recetaActual) return;
    try {
      await descartarReceta(recetaActual.id);
      showSuccess('Receta descartada');
    } catch {
      showError('No se pudo descartar la receta');
    }
  };

  const handleDobleToqueLike = async () => {
    if (!recetaActual || recetaActual.yaLike) return;
    try {
      await darLike(recetaActual.id);
      showSuccess('Te gusta esta receta');
    } catch {
      // Idempotente: si ya tenía like, ignoramos el conflicto sin molestar al usuario
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!recetaActual) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <FeedEmptyState />
      </SafeAreaView>
    );
  }

  const cartasDetras = recetas.slice(indiceActual + 1, indiceActual + 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Feed</Text>
      </View>

      <View style={styles.stack}>
        {cartasDetras
          .slice()
          .reverse()
          .map((receta, indexInvertido) => {
            const posicion = cartasDetras.length - indexInvertido;
            return (
              <View
                key={receta.id}
                pointerEvents="none"
                style={[
                  styles.cartaFondo,
                  {
                    transform: [
                      { scale: 1 - posicion * 0.04 },
                      { translateY: posicion * 10 },
                    ],
                  },
                ]}
              >
                <RecetaCard receta={receta} />
              </View>
            );
          })}

        <View style={styles.cartaActual}>
          <GestosCard
            key={recetaActual.id}
            receta={recetaActual}
            onGuardar={handleGuardar}
            onDescartar={handleDescartar}
            onLike={handleDobleToqueLike}
            onPress={() => router.push(`/feed/${recetaActual.id}`)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitulo: {
    ...typography.heading1,
    color: colors.text.primary,
  },
  stack: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  cartaActual: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  cartaFondo: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
});
