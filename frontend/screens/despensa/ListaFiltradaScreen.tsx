import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductoEstadoBadge } from '@/components/despensa/ProductoEstadoBadge';
import { Producto } from '@/services/despensaService';
import { despensaService, EstadoProducto } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type FiltroEstado = 'proximoCaducar' | 'caducado' | 'bajoStock';

const TITULOS: Record<FiltroEstado, string> = {
  proximoCaducar: 'Próximos a caducar',
  caducado: 'Productos caducados',
  bajoStock: 'Bajo stock',
};

const MENSAJES_VACIOS: Record<FiltroEstado, string> = {
  proximoCaducar: '¡Todo en orden! Ningún producto está próximo a caducar',
  caducado: '¡Perfecto! No tienes productos caducados',
  bajoStock: '¡Genial! Tienes suficiente stock de todo',
};

export function ListaFiltradaScreen() {
  const router = useRouter();
  const { filtro } = useLocalSearchParams<{ filtro: FiltroEstado }>();
  const { eliminarProducto } = useDespensaStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const titulo = TITULOS[filtro] ?? 'Productos';
  const mensajeVacio = MENSAJES_VACIOS[filtro] ?? 'No hay productos en esta categoría';
  const esCaducado = filtro === 'caducado';
  const esProximo = filtro === 'proximoCaducar';

  const cargar = useCallback(async () => {
    setIsLoading(true);
    try {
      const lista = await despensaService.filtrarProductos({ estado: filtro });
      setProductos(lista);
    } catch {
      // lista vacía en caso de error
    } finally {
      setIsLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleEliminar = useCallback((id: string, nombre: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${nombre}" de tu despensa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await eliminarProducto(id);
            setProductos((prev) => prev.filter((p) => p.id !== id));
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={productos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargar} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View>
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/despensa/${item.id}`)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
                <Text style={styles.cantidad}>{item.cantidad} {item.unidad}</Text>
                {item.categoria ? (
                  <Text style={styles.categoria}>{item.categoria}</Text>
                ) : null}
              </View>
              <View style={styles.cardDerecha}>
                <ProductoEstadoBadge estado={item.estado as EstadoProducto} size="sm" />
                {esCaducado && (
                  <Pressable
                    style={styles.btnEliminar}
                    onPress={() => handleEliminar(item.id, item.nombre)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </Pressable>
                )}
              </View>
            </Pressable>

            {esProximo && (
              <View style={styles.carritoPlaceholder}>
                <Ionicons name="cart-outline" size={13} color={colors.grayMid} />
                <Text style={styles.carritoTexto}>Añadir al carrito</Text>
                <View style={styles.proximamenteBadge}>
                  <Text style={styles.proximamenteTexto}>Próximamente</Text>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="checkmark-circle-outline" size={56} color={colors.primary} />
              <Text style={styles.vacioTexto}>{mensajeVacio}</Text>
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
  lista: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },

  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flex: 1, gap: 2 },
  nombre: { ...typography.label, color: colors.text.primary },
  cantidad: { ...typography.caption, color: colors.text.secondary },
  categoria: { ...typography.caption, color: colors.primary, fontWeight: '600', fontSize: 10 },
  cardDerecha: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  btnEliminar: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFEBEE',
  },

  carritoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: -2,
    marginBottom: spacing.xs,
    backgroundColor: colors.grayLight,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  carritoTexto: { ...typography.caption, color: colors.grayMid, flex: 1 },
  proximamenteBadge: {
    backgroundColor: colors.secondary + '33',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  proximamenteTexto: {
    ...typography.caption,
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },

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
