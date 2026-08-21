import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ItemCarritoInput } from '@/services/carritoService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const UNIDADES = ['unidades', 'kg', 'g', 'litros', 'ml', 'packs', 'latas', 'bolsas'];
const CATEGORIAS = [
  'Frutas y verduras', 'Carnes', 'Pescados', 'Lácteos',
  'Bebidas', 'Congelados', 'Condimentos', 'Cereales',
  'Conservas', 'Snacks', 'Otros',
];

interface Props {
  onAñadir: (datos: ItemCarritoInput) => Promise<void>;
  isLoading?: boolean;
}

export function FormItemManual({ onAñadir, isLoading = false }: Props) {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('unidades');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Obligatorio';
    const cant = parseFloat(cantidad);
    if (!cantidad || isNaN(cant) || cant <= 0) e.cantidad = 'Debe ser mayor que 0';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleAñadir = async () => {
    if (!validar()) return;
    await onAñadir({
      nombre: nombre.trim(),
      cantidad: parseFloat(cantidad),
      unidad,
      categoria: categoria ?? undefined,
    });
    setNombre('');
    setCantidad('');
    setCategoria(null);
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
            placeholder="Nombre del producto *"
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

      <Text style={styles.selectorLabel}>Unidad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          {UNIDADES.map((op) => (
            <Pressable
              key={op}
              style={[styles.chip, unidad === op && styles.chipActivo]}
              onPress={() => setUnidad(op)}
              hitSlop={4}
            >
              <Text style={[styles.chipText, unidad === op && styles.chipTextActivo]}>{op}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.selectorLabel}>Categoría (opcional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsRow}>
          {CATEGORIAS.map((op) => (
            <Pressable
              key={op}
              style={[styles.chip, categoria === op && styles.chipActivo]}
              onPress={() => setCategoria(categoria === op ? null : op)}
              hitSlop={4}
            >
              <Text style={[styles.chipText, categoria === op && styles.chipTextActivo]}>{op}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.btnAñadir, isLoading && styles.btnDisabled]}
        onPress={handleAñadir}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.btnText}>+ Añadir al carrito</Text>
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
  selectorLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
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
  btnAñadir: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...typography.label, color: colors.white },
});
