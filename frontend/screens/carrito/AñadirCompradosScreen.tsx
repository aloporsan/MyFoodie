import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useToast } from '@/hooks/useToast';
import { ItemCompradoAjuste, UNIDADES_CARRITO } from '@/services/carritoService';
import { useCarritoStore } from '@/store/carritoStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function dateToApi(d: Date): string {
  return d.toISOString().split('T')[0];
}

function apiToDisplay(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

interface EdicionItem {
  cantidad: string;
  unidad: string;
  fechaCaducidad: string;
}

export function AñadirCompradosScreen() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { listaActiva, isLoading, cargarLista, añadirCompradosADespensa } = useCarritoStore();
  const [ediciones, setEdiciones] = useState<Record<string, EdicionItem>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (id) cargarLista(id);
  }, [id]);

  const comprados = (listaActiva?.items ?? []).filter((i) => i.estado === 'comprado');

  // Se inicializa una única vez, cuando llegan los datos por primera vez.
  // Así no se pisa lo que el usuario ya haya editado en re-renders posteriores.
  useEffect(() => {
    if (comprados.length === 0) return;
    setEdiciones((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const inicial: Record<string, EdicionItem> = {};
      for (const item of comprados) {
        inicial[item.id] = { cantidad: String(item.cantidad), unidad: item.unidad, fechaCaducidad: '' };
      }
      return inicial;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comprados.length]);

  const handleCantidadChange = (itemId: string, texto: string) => {
    setEdiciones((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], cantidad: texto },
    }));
  };

  const handleUnidadChange = (itemId: string, unidad: string) => {
    setEdiciones((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], unidad },
    }));
  };

  const handleFechaChange = (itemId: string, fecha: string) => {
    setEdiciones((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], fechaCaducidad: fecha },
    }));
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/carrito/listas'));

  const handleAñadirTodos = async () => {
    if (!id) return;
    setGuardando(true);
    try {
      const ajustes: ItemCompradoAjuste[] = comprados.map((item) => {
        const edicion = ediciones[item.id];
        const cantidad = edicion ? parseFloat(edicion.cantidad) : item.cantidad;
        return {
          itemId: item.id,
          cantidad: !isNaN(cantidad) && cantidad > 0 ? cantidad : item.cantidad,
          unidad: edicion?.unidad || item.unidad,
          fechaCaducidad: edicion?.fechaCaducidad || undefined,
        };
      });
      await añadirCompradosADespensa(id, ajustes);
      showSuccess('Productos añadidos a tu despensa');
      router.replace('/despensa');
    } finally {
      setGuardando(false);
    }
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
        <Text style={styles.headerTitulo}>Añadir a la despensa</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {comprados.map((item) => {
          const edicion = ediciones[item.id] ?? {
            cantidad: String(item.cantidad),
            unidad: item.unidad,
            fechaCaducidad: '',
          };
          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <View style={styles.fila}>
                <View style={styles.cantidadGroup}>
                  <Text style={styles.campoLabel}>Cantidad</Text>
                  <TextInput
                    style={styles.cantidadInput}
                    value={edicion.cantidad}
                    onChangeText={(t) => handleCantidadChange(item.id, t)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.flexGrow}>
                  <Text style={styles.campoLabel}>Fecha de caducidad</Text>
                  <FechaCaducidadInput
                    value={edicion.fechaCaducidad}
                    onChange={(v) => handleFechaChange(item.id, v)}
                  />
                </View>
              </View>

              <Text style={styles.campoLabel}>Unidad</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {UNIDADES_CARRITO.map((op) => (
                    <Pressable
                      key={op}
                      style={[styles.chip, edicion.unidad === op && styles.chipActivo]}
                      onPress={() => handleUnidadChange(item.id, op)}
                      hitSlop={4}
                    >
                      <Text style={[styles.chipText, edicion.unidad === op && styles.chipTextActivo]}>
                        {op}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btnGuardar, (guardando || comprados.length === 0) && styles.btnDisabled]}
          onPress={handleAñadirTodos}
          disabled={guardando || comprados.length === 0}
        >
          {guardando ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.btnGuardarText}>Añadir todos a la despensa</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FechaCaducidadInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const pickerDate = value ? new Date(value + 'T12:00:00') : new Date();

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (date) onChange(dateToApi(date));
  };

  return (
    <>
      <Pressable style={styles.fechaBtn} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={16} color={value ? colors.primary : colors.grayMid} />
        <Text style={[styles.fechaText, !value && styles.fechaPlaceholder]}>
          {value ? apiToDisplay(value) : 'Opcional'}
        </Text>
      </Pressable>

      {show && Platform.OS === 'android' && (
        <DateTimePicker value={pickerDate} mode="date" display="default" onChange={handleChange} />
      )}

      {show && Platform.OS === 'ios' && (
        <View style={styles.iosWrapper}>
          <Pressable style={styles.doneBtn} onPress={() => setShow(false)}>
            <Text style={styles.doneBtnText}>Hecho</Text>
          </Pressable>
          <DateTimePicker value={pickerDate} mode="date" display="spinner" onChange={handleChange} />
        </View>
      )}
    </>
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
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  nombre: { ...typography.label, color: colors.text.primary },
  fila: { flexDirection: 'row', gap: spacing.md },
  cantidadGroup: { width: 100 },
  flexGrow: { flex: 1 },
  campoLabel: { ...typography.caption, color: colors.text.secondary, marginBottom: 4 },
  cantidadInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
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
  fechaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  fechaText: { ...typography.body, color: colors.text.primary },
  fechaPlaceholder: { color: colors.grayMid },
  iosWrapper: {
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  doneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  doneBtnText: { ...typography.label, color: colors.primary, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnGuardarText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
