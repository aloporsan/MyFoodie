import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ModalFusion } from '@/components/despensa/ModalFusion';
import { ParDuplicado } from '@/services/matchingService';
import { useFusionStore } from '@/store/fusionStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function DuplicadosScreen() {
  const router = useRouter();
  const { duplicados, isLoading, cargarDuplicados, ignorarFusion } = useFusionStore();
  const [parSeleccionado, setParSeleccionado] = useState<ParDuplicado | null>(null);

  useEffect(() => {
    cargarDuplicados();
  }, []);

  if (isLoading && duplicados.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Posibles duplicados</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={duplicados}
        keyExtractor={(par) => `${par.productoA.id}-${par.productoB.id}`}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargarDuplicados} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{Math.round(item.similitud * 100)}%</Text>
              </View>
              <Text style={styles.sugerencia}>¿Son el mismo producto?</Text>
            </View>

            <Pressable
              style={styles.producto}
              onPress={() => router.push(`/despensa/${item.productoA.id}`)}
            >
              <Text style={styles.productoNombre}>{item.productoA.nombre}</Text>
              <Text style={styles.productoCantidad}>
                {item.productoA.cantidad} {item.productoA.unidad}
              </Text>
            </Pressable>
            <Pressable
              style={styles.producto}
              onPress={() => router.push(`/despensa/${item.productoB.id}`)}
            >
              <Text style={styles.productoNombre}>{item.productoB.nombre}</Text>
              <Text style={styles.productoCantidad}>
                {item.productoB.cantidad} {item.productoB.unidad}
              </Text>
            </Pressable>

            <View style={styles.acciones}>
              <Pressable style={styles.btnFusionar} onPress={() => setParSeleccionado(item)}>
                <Text style={styles.btnFusionarTexto}>Fusionar</Text>
              </Pressable>
              <Pressable
                style={styles.btnDistintos}
                onPress={() => ignorarFusion(item.productoA.id, item.productoB.id)}
              >
                <Text style={styles.btnDistintosTexto}>Son distintos</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="checkmark-circle-outline" size={56} color={colors.primary} />
              <Text style={styles.vacioTexto}>
                ¡Todo en orden! No hemos detectado productos duplicados
              </Text>
            </View>
          ) : null
        }
      />

      <ModalFusion
        visible={!!parSeleccionado}
        par={parSeleccionado}
        onClose={() => setParSeleccionado(null)}
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
  lista: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },

  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  badge: {
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeTexto: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  sugerencia: { ...typography.body, color: colors.text.secondary, flex: 1 },

  producto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  productoNombre: { ...typography.label, color: colors.text.primary, flex: 1 },
  productoCantidad: { ...typography.caption, color: colors.text.secondary },

  acciones: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnFusionar: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnFusionarTexto: { ...typography.button, color: colors.white },
  btnDistintos: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnDistintosTexto: { ...typography.button, color: colors.text.secondary },

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
