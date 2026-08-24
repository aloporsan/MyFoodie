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
import { despensaService } from '@/services/despensaService';
import { MatchProducto, matchingService } from '@/services/matchingService';
import { useCarritoStore } from '@/store/carritoStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface PreviewMatching {
  match: MatchProducto | null;
  // Solo relevante cuando match.tipoMatch === 'PROPONER'. null = el usuario aún no ha respondido.
  respuesta: boolean | null;
}

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
  const [preview, setPreview] = useState<Record<string, PreviewMatching>>({});
  const [cargandoPreview, setCargandoPreview] = useState(false);
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

  // Preview de matching: comprueba en paralelo si cada item comprado se parece a algo que
  // ya hay en la despensa, solo para mostrar el aviso mientras se revisa la lista. La decisión
  // real (fusionar, crear o actualizar) la toma el backend al pulsar "Añadir todos".
  useEffect(() => {
    if (comprados.length === 0 || Object.keys(preview).length > 0) return;
    let cancelado = false;
    setCargandoPreview(true);
    Promise.all(
      comprados.map(async (item) => {
        const matches = await matchingService.buscarSimilares(item.nombre);
        return [item.id, matches[0] ?? null] as const;
      })
    ).then((resultados) => {
      if (cancelado) return;
      const siguiente: Record<string, PreviewMatching> = {};
      for (const [itemId, match] of resultados) {
        siguiente[itemId] = { match, respuesta: null };
      }
      setPreview(siguiente);
      setCargandoPreview(false);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comprados.length]);

  const handleResponderSugerencia = (itemId: string, esLoMismo: boolean) => {
    setPreview((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], respuesta: esLoMismo },
    }));
  };

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

  const cantidadFinalDe = (item: (typeof comprados)[number]): number => {
    const edicion = ediciones[item.id];
    const cantidad = edicion ? parseFloat(edicion.cantidad) : item.cantidad;
    return !isNaN(cantidad) && cantidad > 0 ? cantidad : item.cantidad;
  };

  const handleAñadirTodos = async () => {
    if (!id) return;
    setGuardando(true);
    try {
      const ajustes: ItemCompradoAjuste[] = comprados.map((item) => ({
        itemId: item.id,
        cantidad: cantidadFinalDe(item),
        unidad: ediciones[item.id]?.unidad || item.unidad,
        fechaCaducidad: ediciones[item.id]?.fechaCaducidad || undefined,
      }));

      // El backend ya resuelve los AUTOMATICO (>=85%, actualiza cantidad) y los que no
      // se parecen a nada (crea nuevo). Las "sugerencia" (60-84%) las deja sin persistir
      // a propósito, así que aquí se resuelven según lo que el usuario respondió en el
      // aviso: "Sí" fusiona con el existente, "No" (o si no respondió) crea uno nuevo.
      const resultados = await añadirCompradosADespensa(id, ajustes);

      for (const resultado of resultados) {
        if (resultado.accion !== 'sugerencia' || !resultado.productoExistente) continue;
        const item = comprados.find((i) => i.nombre === resultado.itemNombre);
        const respuesta = item ? preview[item.id]?.respuesta : null;
        const cantidad = item ? cantidadFinalDe(item) : 1;

        if (respuesta === true) {
          await despensaService.actualizarCantidad(
            resultado.productoExistente.id,
            cantidad,
            undefined,
            undefined,
            'Añadido desde lista de compra'
          );
        } else {
          await despensaService.añadirProducto({
            nombre: resultado.itemNombre,
            cantidad,
            unidad: (item && ediciones[item.id]?.unidad) || item?.unidad || 'unidad',
            categoria: item?.categoria ?? undefined,
            fechaCaducidad: (item && ediciones[item.id]?.fechaCaducidad) || undefined,
          });
        }
      }

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

      {cargandoPreview && (
        <View style={styles.previewAviso}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.previewAvisoTexto}>Comprobando coincidencias con tu despensa...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {comprados.map((item) => {
          const edicion = ediciones[item.id] ?? {
            cantidad: String(item.cantidad),
            unidad: item.unidad,
            fechaCaducidad: '',
          };
          const info = preview[item.id];
          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.nombre}>{item.nombre}</Text>

              {info?.match?.tipoMatch === 'AUTOMATICO' && (
                <View style={styles.badgeAutomatico}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primaryDark} />
                  <Text style={styles.badgeAutomaticoTexto}>
                    Se actualizará la cantidad de {info.match.producto.nombre}
                  </Text>
                </View>
              )}

              {info?.match?.tipoMatch === 'PROPONER' && (
                <View style={styles.banner}>
                  {info.respuesta === null ? (
                    <>
                      <Text style={styles.bannerTexto}>
                        ¿Es lo mismo que {info.match.producto.nombre}?
                      </Text>
                      <View style={styles.bannerBotones}>
                        <Pressable
                          style={[styles.bannerBtn, styles.bannerBtnSi]}
                          onPress={() => handleResponderSugerencia(item.id, true)}
                        >
                          <Text style={styles.bannerBtnSiTexto}>Sí, es lo mismo</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.bannerBtn, styles.bannerBtnNo]}
                          onPress={() => handleResponderSugerencia(item.id, false)}
                        >
                          <Text style={styles.bannerBtnNoTexto}>No, es distinto</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <Pressable
                      style={styles.bannerRespuesta}
                      onPress={() => handleResponderSugerencia(item.id, !info.respuesta)}
                    >
                      <Ionicons
                        name={info.respuesta ? 'checkmark-circle' : 'add-circle'}
                        size={16}
                        color={info.respuesta ? colors.primary : colors.error}
                      />
                      <Text style={styles.bannerRespuestaTexto}>
                        {info.respuesta
                          ? `Se fusionará con ${info.match.producto.nombre}`
                          : 'Se añadirá como producto nuevo'}
                      </Text>
                      <Text style={styles.bannerCambiar}>Cambiar</Text>
                    </Pressable>
                  )}
                </View>
              )}

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
  previewAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  previewAvisoTexto: { ...typography.caption, color: colors.text.secondary },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  nombre: { ...typography.label, color: colors.text.primary },
  badgeAutomatico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: '#EBF6D6',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeAutomaticoTexto: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  banner: {
    backgroundColor: '#FEF3E0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  bannerTexto: { ...typography.body, color: colors.text.primary },
  bannerBotones: { flexDirection: 'row', gap: spacing.sm },
  bannerBtn: {
    flex: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  bannerBtnSi: { backgroundColor: colors.primary },
  bannerBtnSiTexto: { ...typography.label, color: colors.white },
  bannerBtnNo: { backgroundColor: colors.error },
  bannerBtnNoTexto: { ...typography.label, color: colors.white },
  bannerRespuesta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bannerRespuestaTexto: { ...typography.caption, color: colors.text.primary, flex: 1 },
  bannerCambiar: { ...typography.caption, color: colors.secondary, fontWeight: '700' },
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
