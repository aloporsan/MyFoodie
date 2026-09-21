import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { RecetaCardCompacta } from '@/components/receta';
import { showConfirm } from '@/hooks/useConfirm';
import { useRecetaStore } from '@/store/recetaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function RecetasPublicadasScreen() {
  const router = useRouter();
  const recetas = useRecetaStore((s) => s.recetas);
  const cargarMisRecetas = useRecetaStore((s) => s.cargarMisRecetas);
  const eliminarReceta = useRecetaStore((s) => s.eliminarReceta);
  const [refreshing, setRefreshing] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  useEffect(() => {
    cargarMisRecetas().finally(() => setCargandoInicial(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarMisRecetas();
    setRefreshing(false);
  };

  // Misma acción y mismo modal de confirmación que se usan al eliminar desde dentro del
  // detalle de receta (DetalleRecetaScreen): así se puede borrar directamente desde la lista
  // sin tener que entrar a la receta primero.
  const confirmarEliminar = (id: string, titulo: string) => {
    showConfirm(
      'Eliminar receta',
      `¿Seguro que quieres eliminar "${titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarReceta(id);
            } catch {
              showConfirm('Error', 'No se pudo eliminar la receta. Inténtalo de nuevo.', undefined, {
                icon: 'alert-circle-outline',
              });
            }
          },
        },
      ],
      { icon: 'trash-outline' }
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
        <Text style={styles.headerTitulo}>Mis recetas</Text>
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
              <Ionicons name="book-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitulo}>Aún no has publicado ninguna receta</Text>
            <Pressable
              style={styles.crearBtn}
              onPress={() => router.push('/(tabs)/receta')}
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.crearBtnTexto}>Crear mi primera receta</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <RecetaCardCompacta
            receta={item}
            descripcion={item.descripcion}
            likes={item.totalLikes ?? 0}
            estadoBadge={item.estado === 'publicada' ? 'publicada' : 'borrador'}
            onPress={() => router.push({ pathname: '/receta/[id]', params: { id: item.id } })}
            onEditar={() => router.push(`/receta/editar?id=${item.id}`)}
            swipe={{
              izquierda: {
                icono: 'trash-outline',
                label: 'Eliminar',
                color: colors.error,
                onAction: () => confirmarEliminar(item.id, item.titulo),
              },
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
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
  crearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  crearBtnTexto: { ...typography.label, color: colors.white, fontWeight: '700' },
});
