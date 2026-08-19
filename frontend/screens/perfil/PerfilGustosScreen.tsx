import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { showConfirm } from '@/hooks/useConfirm';
import { useFeedStore } from '@/store/feedStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

const FONT_SIZE_ETIQUETA_MIN = 12;
const FONT_SIZE_ETIQUETA_MAX = 20;

export function PerfilGustosScreen() {
  const router = useRouter();
  const perfilGustos = useFeedStore((s) => s.perfilGustos);
  const isLoadingPerfilGustos = useFeedStore((s) => s.isLoadingPerfilGustos);
  const cargarPerfilGustos = useFeedStore((s) => s.cargarPerfilGustos);
  const resetearPerfilGustos = useFeedStore((s) => s.resetearPerfilGustos);

  useEffect(() => {
    cargarPerfilGustos();
  }, []);

  const handleResetear = () => {
    showConfirm(
      'Resetear mis gustos',
      'Se borrará todo lo que hemos aprendido sobre tus preferencias culinarias.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            showConfirm(
              '¿Estás completamente seguro?',
              'Esta acción no se puede deshacer. Tus recomendaciones volverán a empezar desde cero.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Resetear definitivamente',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await resetearPerfilGustos();
                    } catch {
                      showConfirm('Error', 'No se pudieron resetear tus gustos. Inténtalo de nuevo.', undefined, {
                        icon: 'alert-circle-outline',
                      });
                    }
                  },
                },
              ],
              { icon: 'warning-outline' }
            );
          },
        },
      ],
      { icon: 'refresh-outline' }
    );
  };

  if (isLoadingPerfilGustos && !perfilGustos) {
    return <LoadingScreen />;
  }

  const categorias = ordenarPorPuntuacion(perfilGustos?.categoriasPreferidas);
  const etiquetas = ordenarPorPuntuacion(perfilGustos?.etiquetasPreferidas);
  const dificultadPreferida = ordenarPorPuntuacion(perfilGustos?.dificultadesPreferidas)[0]?.clave;
  const sinDatos = categorias.length === 0 && etiquetas.length === 0 && !dificultadPreferida;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Mis gustos culinarios</Text>
        <View style={{ width: 40 }} />
      </View>

      {sinDatos ? (
        <View style={styles.vacioContainer}>
          <Ionicons name="sparkles-outline" size={56} color={colors.grayMid} />
          <Text style={styles.vacioTexto}>
            Aún no tenemos suficiente información sobre tus gustos. ¡Sigue explorando recetas!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {categorias.length > 0 && (
            <Seccion titulo="Categorías favoritas">
              {categorias.map(({ clave, puntuacion, proporcion }) => (
                <View key={clave} style={styles.barraFila} testID={`categoria-${clave}`}>
                  <Text style={styles.barraLabel}>{clave}</Text>
                  <View style={styles.barraFondo}>
                    <View style={[styles.barraRelleno, { width: `${proporcion * 100}%` }]} />
                  </View>
                  <Text style={styles.barraPuntuacion}>{puntuacion}</Text>
                </View>
              ))}
            </Seccion>
          )}

          {etiquetas.length > 0 && (
            <Seccion titulo="Etiquetas que más te gustan">
              <View style={styles.etiquetasRow}>
                {etiquetas.map(({ clave, proporcion }) => (
                  <View key={clave} style={styles.etiquetaChip} testID={`etiqueta-${clave}`}>
                    <Text
                      style={[
                        styles.etiquetaTexto,
                        { fontSize: interpolarFontSize(proporcion) },
                      ]}
                    >
                      {clave}
                    </Text>
                  </View>
                ))}
              </View>
            </Seccion>
          )}

          <Seccion titulo="Preferencias">
            <View style={styles.preferenciaFila}>
              <Ionicons name="flag-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.preferenciaLabel}>Dificultad preferida</Text>
              <Text style={styles.preferenciaValor}>{dificultadPreferida ?? 'Sin datos aún'}</Text>
            </View>
            <View style={styles.preferenciaFila}>
              <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.preferenciaLabel}>Tiempo máximo habitual</Text>
              <Text style={styles.preferenciaValor}>
                {perfilGustos?.tiempoMaximoHabitual ? `${perfilGustos.tiempoMaximoHabitual} min` : 'Sin datos aún'}
              </Text>
            </View>
          </Seccion>

          <Pressable style={styles.resetearBtn} onPress={handleResetear} testID="btn-resetear-gustos">
            <Ionicons name="refresh-outline" size={18} color={colors.error} />
            <Text style={styles.resetearTexto}>Resetear mis gustos</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface EntradaPuntuada {
  clave: string;
  puntuacion: number;
  proporcion: number;
}

function ordenarPorPuntuacion(mapa?: Record<string, number>): EntradaPuntuada[] {
  if (!mapa) return [];
  const entradas = Object.entries(mapa).filter(([, puntuacion]) => puntuacion > 0);
  const maxima = Math.max(...entradas.map(([, puntuacion]) => puntuacion), 1);

  return entradas
    .map(([clave, puntuacion]) => ({ clave, puntuacion, proporcion: puntuacion / maxima }))
    .sort((a, b) => b.puntuacion - a.puntuacion);
}

function interpolarFontSize(proporcion: number): number {
  return FONT_SIZE_ETIQUETA_MIN + proporcion * (FONT_SIZE_ETIQUETA_MAX - FONT_SIZE_ETIQUETA_MIN);
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={seccionStyles.wrapper}>
      <Text style={seccionStyles.titulo}>{titulo}</Text>
      <View style={seccionStyles.card}>{children}</View>
    </View>
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
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  vacioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  vacioTexto: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  barraFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  barraLabel: {
    ...typography.caption,
    color: colors.text.primary,
    width: 90,
  },
  barraFondo: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  barraPuntuacion: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 24,
    textAlign: 'right',
  },
  etiquetasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  etiquetaChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  etiquetaTexto: {
    fontFamily: typography.fontFamily.medium,
    color: colors.primaryDark,
  },
  preferenciaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  preferenciaLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  preferenciaValor: {
    ...typography.label,
    color: colors.text.secondary,
  },
  resetearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  resetearTexto: {
    ...typography.button,
    color: colors.error,
  },
});

const seccionStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  titulo: {
    ...typography.caption,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
});
