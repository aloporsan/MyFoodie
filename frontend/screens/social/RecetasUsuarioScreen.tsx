import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { RecetaCardVertical } from '@/components/receta';
import { Receta, recetaService } from '@/services/recetaService';
import { handleApiError } from '@/utils/errorHandler';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function RecetasUsuarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; nombre?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const nombre = Array.isArray(params.nombre) ? params.nombre[0] : params.nombre;

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!id) return;
    try {
      setRecetas(await recetaService.recetasDeUsuario(id));
      setError(null);
    } catch (e) {
      setError(handleApiError(e));
    }
  }, [id]);

  useEffect(() => {
    cargar().finally(() => setCargandoInicial(false));
  }, [cargar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
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
        <Text style={styles.headerTitulo} numberOfLines={1}>
          {nombre ? `Recetas de ${nombre}` : 'Recetas'}
        </Text>
        <View style={styles.headerRight}>
          {recetas.length > 0 && (
            <View style={styles.contador}>
              <Text style={styles.contadorTexto}>{recetas.length}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={recetas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={recetas.length === 0 ? styles.centrado : styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <Ionicons name="book-outline" size={52} color={colors.grayMid} />
            <Text style={styles.emptyTitulo}>
              {error ?? 'Este usuario no tiene recetas publicadas'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecetaCardVertical
            receta={item}
            onPress={() => router.push({ pathname: '/receta/[id]', params: { id: item.id } })}
          />
        )}
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
    borderBottomColor: colors.grayLight,
    gap: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { ...typography.heading3, color: colors.text.primary, flex: 1, textAlign: 'center' },
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
  centrado: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyWrapper: { alignItems: 'center', gap: spacing.md },
  emptyTitulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
});
