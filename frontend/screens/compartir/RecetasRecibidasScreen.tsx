import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecetaCompartidaCard } from '@/components/compartir/RecetaCompartidaCard';
import { useCompartirStore } from '@/store/compartirStore';
import { colors, spacing, typography } from '@/theme';

export function RecetasRecibidasScreen() {
  const router = useRouter();

  const recetasRecibidas = useCompartirStore((s) => s.recetasRecibidas);
  const isLoading = useCompartirStore((s) => s.isLoading);
  const cargarRecibidas = useCompartirStore((s) => s.cargarRecibidas);
  const marcarComoLeida = useCompartirStore((s) => s.marcarComoLeida);

  useEffect(() => {
    cargarRecibidas();
  }, []);

  useEffect(() => {
    const noLeidas = recetasRecibidas.filter((r) => !r.leida);
    if (noLeidas.length > 0) {
      Promise.all(noLeidas.map((r) => marcarComoLeida(r.id))).catch(() => {});
    }
  }, [recetasRecibidas.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Recetas recibidas</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={recetasRecibidas}
        keyExtractor={(r) => r.id}
        contentContainerStyle={recetasRecibidas.length === 0 ? styles.listaVacia : styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargarRecibidas} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <RecetaCompartidaCard
            recetaCompartida={item}
            onVerReceta={() => router.push(`/compartir/recibidas/${item.id}` as never)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="gift-outline" size={56} color={colors.grayMid} />
              <Text style={styles.vacioTexto}>Aún no te han compartido ninguna receta</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
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
    borderBottomColor: colors.gray,
  },
  titulo: { ...typography.heading2, color: colors.text.primary },

  lista: { padding: spacing.lg, flexGrow: 1 },
  listaVacia: { flexGrow: 1 },

  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  vacioTexto: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
