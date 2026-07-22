import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { BotonesAccionFeed, FeedEmptyState, GestosCard, RecetaCard } from '@/components/feed';
import { useToast } from '@/hooks/useToast';
import { useFeedStore } from '@/store/feedStore';
import { borderRadius, colors, spacing, typography } from '@/theme';

const CARTAS_A_PRECARGAR = 3;
const DURACION_DESHACER_MS = 3000;

export function FeedScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const recetas = useFeedStore((s) => s.recetas);
  const isLoading = useFeedStore((s) => s.isLoading);
  const isLoadingMas = useFeedStore((s) => s.isLoadingMas);
  const hayMas = useFeedStore((s) => s.hayMas);
  const ultimaAccion = useFeedStore((s) => s.ultimaAccion);
  const cargarFeed = useFeedStore((s) => s.cargarFeed);
  const cargarMas = useFeedStore((s) => s.cargarMas);
  const guardarReceta = useFeedStore((s) => s.guardarReceta);
  const descartarReceta = useFeedStore((s) => s.descartarReceta);
  const darLike = useFeedStore((s) => s.darLike);
  const quitarLike = useFeedStore((s) => s.quitarLike);
  const deshacerUltimaAccion = useFeedStore((s) => s.deshacerUltimaAccion);

  const [indiceActual, setIndiceActual] = useState(0);
  const [mostrarDeshacer, setMostrarDeshacer] = useState(false);
  const deshacerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cargarFeed();
  }, []);

  useEffect(() => {
    return () => {
      if (deshacerTimer.current) clearTimeout(deshacerTimer.current);
    };
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

  const mostrarBotonDeshacer = () => {
    setMostrarDeshacer(true);
    if (deshacerTimer.current) clearTimeout(deshacerTimer.current);
    deshacerTimer.current = setTimeout(() => setMostrarDeshacer(false), DURACION_DESHACER_MS);
  };

  const handleGuardar = async () => {
    if (!recetaActual) return;
    try {
      await guardarReceta(recetaActual.id);
      showSuccess('Receta guardada');
      mostrarBotonDeshacer();
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
      mostrarBotonDeshacer();
    } catch {
      showError('No se pudo descartar la receta');
    }
  };

  const handleDobleToqueLike = async () => {
    if (!recetaActual || recetaActual.yaLike) return;
    try {
      await darLike(recetaActual.id);
      showSuccess('Te gusta esta receta');
      mostrarBotonDeshacer();
    } catch {
      // Idempotente: si ya tenía like, ignoramos el conflicto sin molestar al usuario
    }
  };

  const handleLikeToggle = async () => {
    if (!recetaActual) return;
    try {
      if (recetaActual.yaLike) {
        await quitarLike(recetaActual.id);
        showSuccess('Ya no te gusta esta receta');
      } else {
        await darLike(recetaActual.id);
        showSuccess('Te gusta esta receta');
      }
      mostrarBotonDeshacer();
    } catch {
      showError('No se pudo actualizar el like');
    }
  };

  const handleDeshacer = async () => {
    const accion = ultimaAccion;
    if (!accion) return;
    try {
      await deshacerUltimaAccion();
      if (accion.tipo === 'guardada' || accion.tipo === 'descartada') {
        setIndiceActual((i) => Math.max(0, i - 1));
      }
      if (deshacerTimer.current) clearTimeout(deshacerTimer.current);
      setMostrarDeshacer(false);
      showSuccess('Acción deshecha');
    } catch {
      showError('No se pudo deshacer la acción');
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

      <BotonesAccionFeed
        yaLike={recetaActual.yaLike}
        yaGuardada={recetaActual.yaGuardada}
        onDescartar={handleDescartar}
        onDeshacer={handleDeshacer}
        onLike={handleLikeToggle}
        onGuardar={handleGuardar}
      />

      {mostrarDeshacer && (
        <Pressable style={styles.deshacerBtn} onPress={handleDeshacer}>
          <Ionicons name="arrow-undo" size={16} color={colors.white} />
          <Text style={styles.deshacerTexto}>Deshacer</Text>
        </Pressable>
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
    paddingBottom: spacing.sm,
  },
  cartaActual: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  cartaFondo: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  deshacerBtn: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minHeight: 44,
  },
  deshacerTexto: {
    ...typography.label,
    color: colors.white,
    fontWeight: '700',
  },
});
