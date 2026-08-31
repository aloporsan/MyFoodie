import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LoteProducto, LoteProductoInput, OrigenLote } from '@/services/loteService';
import { etiquetaUnidad, UNIDADES_OBJETIVAS } from '@/utils/unidadConfig';
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

interface Props {
  loteInicial?: LoteProducto;
  onGuardar: (datos: LoteProductoInput) => Promise<void>;
  onCancelar?: () => void;
  isLoading?: boolean;
}

export function FormNuevoLote({ loteInicial, onGuardar, onCancelar, isLoading = false }: Props) {
  const esEdicion = !!loteInicial;
  const origenLote: OrigenLote = loteInicial?.origen ?? 'manual';

  const [cantidad, setCantidad] = useState(loteInicial ? String(loteInicial.cantidad) : '');
  const [unidad, setUnidad] = useState(loteInicial?.unidad ?? 'unidad');
  const [fechaCaducidad, setFechaCaducidad] = useState(loteInicial?.fechaCaducidad ?? '');
  const [fechaCompra, setFechaCompra] = useState(loteInicial?.fechaCompra ?? dateToApi(new Date()));
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    const cant = parseFloat(cantidad);
    if (!cantidad || isNaN(cant) || cant <= 0) e.cantidad = 'Debe ser mayor que 0';
    if (!unidad) e.unidad = 'Selecciona una unidad';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    await onGuardar({
      cantidad: parseFloat(cantidad),
      unidad,
      fechaCaducidad: fechaCaducidad || undefined,
      fechaCompra: fechaCompra || undefined,
      origen: origenLote,
    });
  };

  return (
    <View style={styles.container}>
      <Campo label="Cantidad *" error={errores.cantidad}>
        <TextInput
          style={[styles.input, errores.cantidad && styles.inputError]}
          value={cantidad}
          onChangeText={(t) => { setCantidad(t); setErrores((e) => ({ ...e, cantidad: '' })); }}
          placeholder="ej. 2"
          placeholderTextColor={colors.grayMid}
          keyboardType="decimal-pad"
        />
      </Campo>

      <Campo label="Unidad *" error={errores.unidad}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            {UNIDADES_OBJETIVAS.map((op) => (
              <Pressable
                key={op}
                style={[styles.chip, unidad === op && styles.chipActivo]}
                onPress={() => setUnidad(op)}
                hitSlop={4}
              >
                <Text style={[styles.chipText, unidad === op && styles.chipTextActivo]}>
                  {etiquetaUnidad(op)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Campo>

      <Campo label="Fecha de caducidad">
        <DateFieldInput value={fechaCaducidad} onChange={setFechaCaducidad} />
      </Campo>

      <Campo label="Fecha de compra">
        <DateFieldInput value={fechaCompra} onChange={setFechaCompra} />
      </Campo>

      <View style={styles.botonesRow}>
        {onCancelar && (
          <Pressable style={[styles.btnCancelar, isLoading && styles.btnDisabled]} onPress={onCancelar} disabled={isLoading}>
            <Text style={styles.btnCancelarText}>Cancelar</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.btnGuardar, styles.flexGrow, isLoading && styles.btnDisabled]}
          onPress={handleGuardar}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.btnGuardarText}>{esEdicion ? 'Guardar cambios' : '+ Añadir lote'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function DateFieldInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const pickerDate = value ? new Date(value + 'T12:00:00') : new Date();

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (date) onChange(dateToApi(date));
  };

  return (
    <>
      <Pressable style={dateStyles.row} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={18} color={value ? colors.primary : colors.grayMid} />
        <Text style={[dateStyles.text, !value && dateStyles.placeholder]}>
          {value ? apiToDisplay(value) : 'Seleccionar fecha'}
        </Text>
        {value && (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.grayMid} />
          </Pressable>
        )}
      </Pressable>

      {show && Platform.OS === 'android' && (
        <DateTimePicker value={pickerDate} mode="date" display="default" onChange={handleChange} />
      )}

      {show && Platform.OS === 'ios' && (
        <View style={dateStyles.iosWrapper}>
          <Pressable style={dateStyles.doneBtn} onPress={() => setShow(false)}>
            <Text style={dateStyles.doneBtnText}>Hecho</Text>
          </Pressable>
          <DateTimePicker value={pickerDate} mode="date" display="spinner" onChange={handleChange} />
        </View>
      )}
    </>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={campoStyles.container}>
      <Text style={campoStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={campoStyles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  flexGrow: { flex: 1 },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.error },
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
  botonesRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btnCancelar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelarText: { ...typography.label, color: colors.text.secondary },
  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnGuardarText: { ...typography.label, color: colors.white },
  btnDisabled: { opacity: 0.5 },
});

const dateStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  text: { ...typography.body, color: colors.text.primary, flex: 1 },
  placeholder: { color: colors.grayMid },
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
});

const campoStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  error: { ...typography.caption, color: colors.error },
});
