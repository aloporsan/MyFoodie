import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { showConfirm } from '@/hooks/useConfirm';
import { ItemCarrito } from '@/services/carritoService';
import { useCarritoStore } from '@/store/carritoStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function ListaCompraScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { listaActiva, isLoading, cargarLista, alternarComprado, modificarCantidad, eliminarItem } =
    useCarritoStore();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cantidadTexto, setCantidadTexto] = useState('');

  useEffect(() => {
    if (id) cargarLista(id);
  }, [id]);

  const items = listaActiva?.items ?? [];
  const comprados = items.filter((i) => i.estado === 'comprado');
  const progreso = items.length > 0 ? comprados.length / items.length : 0;
  const todosComprados = items.length > 0 && comprados.length === items.length;
  const esCompletada = listaActiva?.estado === 'completada';

  const porCategoria = useMemo(() => {
    const grupos = new Map<string, ItemCarrito[]>();
    for (const item of items) {
      const cat = item.categoria || 'Sin categoría';
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)!.push(item);
    }
    return Array.from(grupos.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaActiva]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/carrito/listas'));

  const handleToggle = (item: ItemCarrito) => {
    if (esCompletada || !id) return;
    alternarComprado(id, item.id);
  };

  const handleMasOpciones = (item: ItemCarrito) => {
    showConfirm('Más opciones', undefined, [
      {
        text: 'Editar cantidad',
        onPress: () => {
          setCantidadTexto(String(item.cantidad));
          setEditandoId(item.id);
        },
      },
      { text: 'Quitar de la lista', style: 'destructive', onPress: () => eliminarItem(item.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleGuardarCantidad = (itemId: string) => {
    const valor = parseFloat(cantidadTexto);
    if (!isNaN(valor) && valor > 0) {
      modificarCantidad(itemId, valor);
    }
    setEditandoId(null);
  };

  if (isLoading && !listaActiva) {
    return <LoadingScreen />;
  }

  if (!listaActiva) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>{listaActiva.nombre}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progresoCard}>
        <Text style={styles.progresoTexto}>
          {comprados.length} de {items.length} producto{items.length !== 1 ? 's' : ''} comprado
          {comprados.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.progresoBarBg}>
          <View style={[styles.progresoBarFill, { width: `${progreso * 100}%` }]} />
        </View>
        {esCompletada && (
          <View style={styles.completadaBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={styles.completadaTexto}>¡Compra completada!</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {porCategoria.map(([categoria, itemsCat]) => (
          <View key={categoria} style={styles.grupo}>
            <Text style={styles.grupoTitulo}>{categoria}</Text>
            {itemsCat.map((item) => {
              const marcado = item.estado === 'comprado';

              if (editandoId === item.id) {
                return (
                  <View key={item.id} style={styles.itemEditRow}>
                    <TextInput
                      style={styles.cantidadInput}
                      value={cantidadTexto}
                      onChangeText={setCantidadTexto}
                      keyboardType="decimal-pad"
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={styles.unidadText}>{item.unidad}</Text>
                    <Pressable style={styles.btnGuardarCantidad} onPress={() => handleGuardarCantidad(item.id)}>
                      <Text style={styles.btnGuardarCantidadText}>Guardar</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditandoId(null)} hitSlop={8}>
                      <Ionicons name="close" size={20} color={colors.text.secondary} />
                    </Pressable>
                  </View>
                );
              }

              return (
                <View key={item.id} style={styles.itemRowContainer}>
                  <Pressable
                    style={styles.itemRow}
                    onPress={() => handleToggle(item)}
                    disabled={esCompletada}
                  >
                    <Ionicons
                      name={marcado ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={marcado ? colors.primary : colors.grayMid}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemNombre, marcado && styles.itemTachado]} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text style={[styles.itemCantidad, marcado && styles.itemTachado]}>
                        {item.cantidad} {item.unidad}
                      </Text>
                    </View>
                  </Pressable>
                  {!esCompletada && (
                    <Pressable style={styles.itemMasBtn} onPress={() => handleMasOpciones(item)} hitSlop={8}>
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.text.secondary} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {!esCompletada && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.btnAñadirDespensa, !todosComprados && styles.btnDisabled]}
            onPress={() => id && router.push(`/carrito/lista/${id}/anadir-despensa`)}
            disabled={!todosComprados}
          >
            <Ionicons name="basket-outline" size={18} color={colors.white} />
            <Text style={styles.btnAñadirDespensaText}>Añadir a despensa</Text>
          </Pressable>
        </View>
      )}
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
  progresoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  progresoTexto: { ...typography.label, color: colors.text.primary },
  progresoBarBg: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
    overflow: 'hidden',
  },
  progresoBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  completadaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  completadaTexto: { ...typography.label, color: colors.primaryDark },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  grupo: { marginBottom: spacing.lg },
  grupoTitulo: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.sm },
  itemRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemMasBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemNombre: { ...typography.body, color: colors.text.primary },
  itemCantidad: { ...typography.caption, color: colors.text.secondary },
  itemTachado: { textDecorationLine: 'line-through', color: colors.grayMid },
  itemEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cantidadInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    width: 70,
    textAlign: 'center',
  },
  unidadText: { ...typography.caption, color: colors.text.secondary },
  btnGuardarCantidad: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  btnGuardarCantidadText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  btnAñadirDespensa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
  },
  btnAñadirDespensaText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
