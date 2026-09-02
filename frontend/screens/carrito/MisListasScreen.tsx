import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useCarritoStore } from '@/store/carritoStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ESTADO_LABEL: Record<string, string> = {
  activa: 'En curso',
  completada: 'Completada',
  archivada: 'Archivada',
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function MisListasScreen() {
  const router = useRouter();
  const { listas, isLoading, cargarListas } = useCarritoStore();

  useEffect(() => {
    cargarListas();
  }, []);

  if (isLoading && listas.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Mis listas de compra</Text>
        <Pressable onPress={() => router.push('/carrito/historial')} hitSlop={8}>
          <Ionicons name="time-outline" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      <FlatList
        data={listas}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargarListas} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/carrito/lista/${item.id}`)}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNombre} numberOfLines={1}>{item.nombre}</Text>
              <Text style={styles.cardFecha}>{formatFecha(item.createdAt)}</Text>
              <Text style={styles.cardItems}>
                {item.items.length} producto{item.items.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                item.estado === 'completada' ? styles.badgeCompletada : styles.badgeActiva,
              ]}
            >
              <Text style={styles.badgeText}>{ESTADO_LABEL[item.estado] ?? item.estado}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="receipt-outline" size={56} color={colors.grayMid} />
            <Text style={styles.emptyTitulo}>Aún no has generado ninguna lista de compra</Text>
          </View>
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
  headerTitulo: { ...typography.heading3, color: colors.text.primary, flex: 1, textAlign: 'center' },
  lista: { padding: spacing.lg, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardNombre: { ...typography.label, color: colors.text.primary },
  cardFecha: { ...typography.caption, color: colors.text.secondary },
  cardItems: { ...typography.caption, color: colors.text.secondary },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  badgeActiva: { backgroundColor: '#E3F2FD' },
  badgeCompletada: { backgroundColor: '#E8F5D0' },
  badgeText: { ...typography.caption, color: colors.text.primary, fontWeight: '600' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyTitulo: { ...typography.heading2, color: colors.text.primary, textAlign: 'center' },
});
