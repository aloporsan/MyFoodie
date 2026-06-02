import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductoEstadoBadge } from '@/components/despensa';
import { useDespensaStore } from '@/store/despensaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function DetalleProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { productos, actualizarCantidad, eliminarProducto } = useDespensaStore();

  const producto = productos.find((p) => p.id === id);

  if (!producto) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.noEncontrado}>Producto no encontrado</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.volver}>← Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleEliminar = () => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${producto.nombre}" de tu despensa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await eliminarProducto(id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>{producto.nombre}</Text>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/despensa/form', params: { id: producto.id } })
          }
          hitSlop={8}
        >
          <Ionicons name="pencil-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Badge de estado */}
        <View style={styles.badgeRow}>
          <ProductoEstadoBadge estado={producto.estado} size="md" />
        </View>

        {/* Nombre y cantidad */}
        <Text style={styles.nombre}>{producto.nombre}</Text>
        {producto.marca && (
          <Text style={styles.marca}>{producto.marca}</Text>
        )}

        {/* Control de cantidad */}
        <View style={styles.cantidadCard}>
          <Text style={styles.cantidadLabel}>Cantidad</Text>
          <View style={styles.cantidadRow}>
            <Pressable
              style={styles.cantidadBtn}
              onPress={() => actualizarCantidad(id, -1)}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </Pressable>
            <Text style={styles.cantidadValor}>
              {producto.cantidad} <Text style={styles.unidad}>{producto.unidad}</Text>
            </Text>
            <Pressable
              style={styles.cantidadBtn}
              onPress={() => actualizarCantidad(id, 1)}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Campos de detalle */}
        <View style={styles.detallesCard}>
          {producto.categoria && (
            <FilaDetalle icono="grid-outline" label="Categoría" valor={producto.categoria} />
          )}
          {producto.fechaCaducidad && (
            <FilaDetalle icono="calendar-outline" label="Caduca" valor={producto.fechaCaducidad} />
          )}
          {producto.fechaCompra && (
            <FilaDetalle icono="bag-handle-outline" label="Comprado" valor={producto.fechaCompra} />
          )}
          {producto.notas && (
            <FilaDetalle icono="document-text-outline" label="Notas" valor={producto.notas} />
          )}
          <FilaDetalle
            icono="time-outline"
            label="Actualizado"
            valor={new Date(producto.updatedAt).toLocaleDateString('es-ES')}
          />
        </View>

        {/* Botón eliminar */}
        <Pressable style={styles.btnEliminar} onPress={handleEliminar}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.btnEliminarText}>Eliminar producto</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilaDetalle({
  icono, label, valor,
}: {
  icono: string; label: string; valor: string;
}) {
  return (
    <View style={filaStyles.row}>
      <Ionicons name={icono as any} size={18} color={colors.grayDark} />
      <Text style={filaStyles.label}>{label}</Text>
      <Text style={filaStyles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  noEncontrado: { ...typography.body, color: colors.text.secondary },
  volver: { ...typography.label, color: colors.primary },
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
  headerTitulo: {
    ...typography.heading2,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  badgeRow: { alignItems: 'flex-start' },
  nombre: { ...typography.heading1, color: colors.text.primary },
  marca: { ...typography.body, color: colors.text.secondary },
  cantidadCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cantidadLabel: { ...typography.label, color: colors.text.secondary },
  cantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  cantidadBtn: {
    backgroundColor: '#E8F5D0',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadValor: {
    ...typography.heading1,
    fontSize: 32,
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  unidad: { ...typography.body, color: colors.text.secondary, fontSize: 16 },
  detallesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  btnEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.error,
    marginTop: spacing.sm,
  },
  btnEliminarText: { ...typography.button, color: colors.error },
});

const filaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  label: { ...typography.caption, color: colors.text.secondary, flex: 1 },
  valor: { ...typography.body, color: colors.text.primary, flexShrink: 1 },
});
