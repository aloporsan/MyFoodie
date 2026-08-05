import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { showConfirm } from '@/hooks/useConfirm';
import { ItemCarrito, UNIDADES_CARRITO } from '@/services/carritoService';
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

  const [itemEditando, setItemEditando] = useState<ItemCarrito | null>(null);
  const [modalCantidadVisible, setModalCantidadVisible] = useState(false);
  const [cantidadTexto, setCantidadTexto] = useState('');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('');

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

  const compradosPorCategoria = useMemo(() => {
    const grupos = new Map<string, ItemCarrito[]>();
    for (const item of comprados) {
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
          setUnidadSeleccionada(item.unidad);
          setItemEditando(item);
          setModalCantidadVisible(true);
        },
      },
      { text: 'Quitar de la lista', style: 'destructive', onPress: () => eliminarItem(item.id) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const ajustarCantidad = (delta: number) => {
    const actual = parseFloat(cantidadTexto) || 0;
    setCantidadTexto(String(Math.max(0, actual + delta)));
  };

  const handleGuardarCantidad = () => {
    if (!itemEditando) return;
    const valor = parseFloat(cantidadTexto);
    if (!isNaN(valor) && valor > 0) {
      modificarCantidad(itemEditando.id, valor, unidadSeleccionada);
    }
    setModalCantidadVisible(false);
    setItemEditando(null);
  };

  const irAAñadirDespensa = () => {
    if (id) router.push(`/carrito/lista/${id}/anadir-despensa`);
  };

  const handleAñadirDespensa = () => {
    if (todosComprados) {
      irAAñadirDespensa();
      return;
    }
    showConfirm(
      'Compra incompleta',
      'No has marcado todos los productos como comprados. ¿Quieres añadir a la despensa solo los que sí has comprado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: irAAñadirDespensa },
      ],
      { icon: 'warning-outline', variant: 'warning' }
    );
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

      {esCompletada ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitulo}>Resumen de la compra</Text>
            <Text style={styles.resumenSubtitulo}>
              {comprados.length} producto{comprados.length !== 1 ? 's' : ''} añadido
              {comprados.length !== 1 ? 's' : ''} a la despensa
            </Text>
            {compradosPorCategoria.map(([categoria, itemsCat]) => (
              <View key={categoria} style={styles.resumenGrupo}>
                <Text style={styles.resumenGrupoTitulo}>{categoria}</Text>
                {itemsCat.map((item) => (
                  <View key={item.id} style={styles.resumenFila}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={styles.resumenItemNombre} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.resumenItemCantidad}>{item.cantidad} {item.unidad}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {porCategoria.map(([categoria, itemsCat]) => (
            <View key={categoria} style={styles.grupo}>
              <Text style={styles.grupoTitulo}>{categoria}</Text>
              {itemsCat.map((item) => {
                const marcado = item.estado === 'comprado';
                return (
                  <View key={item.id} style={styles.itemRowContainer}>
                    <Pressable style={styles.itemRow} onPress={() => handleToggle(item)}>
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
                    <Pressable style={styles.itemMasBtn} onPress={() => handleMasOpciones(item)} hitSlop={8}>
                      <Ionicons name="ellipsis-vertical" size={18} color={colors.text.secondary} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      {!esCompletada && (
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.btnAñadirDespensa,
              !todosComprados && styles.btnAñadirDespensaIncompleta,
              comprados.length === 0 && styles.btnDisabled,
            ]}
            onPress={handleAñadirDespensa}
            disabled={comprados.length === 0}
          >
            <Ionicons name="basket-outline" size={18} color={colors.white} />
            <Text style={styles.btnAñadirDespensaText}>
              {todosComprados ? 'Añadir a despensa' : 'Añadir lo comprado a despensa'}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={modalCantidadVisible}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setModalCantidadVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalCantidadVisible(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>Modificar cantidad</Text>
            {itemEditando && (
              <Text style={styles.modalNombre} numberOfLines={1}>{itemEditando.nombre}</Text>
            )}

            <View style={styles.modalCantidadRow}>
              <Pressable style={styles.stepperBtn} onPress={() => ajustarCantidad(-1)} hitSlop={8}>
                <Ionicons name="remove" size={22} color={colors.primary} />
              </Pressable>
              <TextInput
                style={styles.modalCantidadInput}
                value={cantidadTexto}
                onChangeText={setCantidadTexto}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Pressable style={styles.stepperBtn} onPress={() => ajustarCantidad(1)} hitSlop={8}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <Text style={styles.campoLabel}>Unidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              <View style={styles.chipsRow}>
                {UNIDADES_CARRITO.map((op) => (
                  <Pressable
                    key={op}
                    style={[styles.chip, unidadSeleccionada === op && styles.chipActivo]}
                    onPress={() => setUnidadSeleccionada(op)}
                    hitSlop={4}
                  >
                    <Text style={[styles.chipText, unidadSeleccionada === op && styles.chipTextActivo]}>
                      {op}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalBotones}>
              <Pressable style={styles.btnCancelar} onPress={() => setModalCantidadVisible(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.btnGuardar} onPress={handleGuardarCantidad}>
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemNombre: { ...typography.body, color: colors.text.primary },
  itemCantidad: { ...typography.caption, color: colors.text.secondary },
  itemTachado: { textDecorationLine: 'line-through', color: colors.grayMid },
  resumenCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resumenTitulo: { ...typography.heading3, color: colors.text.primary },
  resumenSubtitulo: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm },
  resumenGrupo: { marginBottom: spacing.md },
  resumenGrupoTitulo: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.xs },
  resumenFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resumenItemNombre: { ...typography.body, color: colors.text.primary, flex: 1 },
  resumenItemCantidad: { ...typography.caption, color: colors.text.secondary },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  modalTitulo: { ...typography.heading2, color: colors.text.primary, textAlign: 'center' },
  modalNombre: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalCantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepperBtn: {
    backgroundColor: '#E8F5D0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCantidadInput: {
    ...typography.heading1,
    fontSize: 28,
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 60,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  campoLabel: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs },
  chipsScroll: { marginBottom: spacing.md },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActivo: { backgroundColor: '#E8F5D0', borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
  chipTextActivo: { color: colors.primaryDark, fontWeight: '700' },
  modalBotones: { flexDirection: 'row', gap: spacing.sm },
  btnCancelar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
  },
  btnCancelarText: { ...typography.button, color: colors.text.secondary },
  btnGuardar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnGuardarText: { ...typography.button, color: colors.white },
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
  btnAñadirDespensaIncompleta: {
    backgroundColor: colors.error,
  },
  btnAñadirDespensaText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
