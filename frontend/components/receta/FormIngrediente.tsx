import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AvisoConversionUnidad } from '@/components/common/AvisoConversionUnidad';
import { IngredienteInput } from '@/services/recetaService';
import {
  equivalenciaMetrica,
  esUnidadSubjetiva,
  etiquetaUnidad,
  UNIDADES_OBJETIVAS,
  UNIDADES_SUBJETIVAS,
} from '@/utils/unidadConfig';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  onGuardar: (datos: IngredienteInput) => Promise<void>;
  isLoading?: boolean;
}

export function FormIngrediente({ onGuardar, isLoading = false }: Props) {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('g');
  const [observacion, setObservacion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Obligatorio';
    const cant = parseFloat(cantidad);
    if (!cantidad || isNaN(cant) || cant <= 0) e.cantidad = 'Debe ser mayor que 0';
    if (!unidad) e.unidad = 'Selecciona una unidad';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    await onGuardar({
      nombre: nombre.trim(),
      cantidad: parseFloat(cantidad),
      unidad,
      observacion: observacion.trim() || undefined,
    });
    setNombre('');
    setCantidad('');
    setObservacion('');
    setErrores({});
  };

  return (
    <View style={styles.container}>
      <View style={styles.fila}>
        <View style={styles.flexGrow}>
          <TextInput
            style={[styles.input, errores.nombre && styles.inputError]}
            value={nombre}
            onChangeText={(v) => { setNombre(v); setErrores((e) => ({ ...e, nombre: '' })); }}
            placeholder="Nombre *"
            placeholderTextColor={colors.grayMid}
          />
          {errores.nombre ? <Text style={styles.error}>{errores.nombre}</Text> : null}
        </View>
        <View style={styles.cantidadGroup}>
          <TextInput
            style={[styles.input, styles.inputCantidad, errores.cantidad && styles.inputError]}
            value={cantidad}
            onChangeText={(v) => { setCantidad(v); setErrores((e) => ({ ...e, cantidad: '' })); }}
            placeholder="Cant."
            placeholderTextColor={colors.grayMid}
            keyboardType="decimal-pad"
          />
          {errores.cantidad ? <Text style={styles.error}>{errores.cantidad}</Text> : null}
        </View>
      </View>

      <Text style={styles.grupoUnidadLabel}>Unidades objetivas (recomendadas)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          {UNIDADES_OBJETIVAS.map((op) => (
            <Pressable
              key={op}
              style={[styles.chip, unidad === op && styles.chipActivo]}
              onPress={() => setUnidad(op)}
              hitSlop={4}
            >
              <Text style={[styles.chipText, unidad === op && styles.chipTextActivo]}>{etiquetaUnidad(op)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.grupoUnidadLabel, styles.grupoUnidadLabelSubjetiva]}>
        Unidades subjetivas (se convertirán automáticamente)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          {UNIDADES_SUBJETIVAS.map((op) => (
            <Pressable
              key={op}
              style={[styles.chip, unidad === op && styles.chipActivo]}
              onPress={() => setUnidad(op)}
              hitSlop={4}
            >
              <Text style={[styles.chipText, unidad === op && styles.chipTextActivo]}>{etiquetaUnidad(op)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {esUnidadSubjetiva(unidad) && (
        <AvisoConversionUnidad equivalencia={equivalenciaMetrica(parseFloat(cantidad), unidad) ?? ''} />
      )}

      <TextInput
        style={styles.input}
        value={observacion}
        onChangeText={setObservacion}
        placeholder="Observación (opcional)"
        placeholderTextColor={colors.grayMid}
      />

      <Pressable
        style={[styles.btnAñadir, isLoading && styles.btnDisabled]}
        onPress={handleGuardar}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.btnText}>+ Añadir ingrediente</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  fila: { flexDirection: 'row', gap: spacing.sm },
  flexGrow: { flex: 1 },
  cantidadGroup: { width: 80 },
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
  inputCantidad: { textAlign: 'center' },
  error: { ...typography.caption, color: colors.error, marginTop: 2 },
  grupoUnidadLabel: { ...typography.caption, color: colors.text.secondary },
  grupoUnidadLabelSubjetiva: { marginTop: spacing.xs },
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
  btnAñadir: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...typography.label, color: colors.white },
});
