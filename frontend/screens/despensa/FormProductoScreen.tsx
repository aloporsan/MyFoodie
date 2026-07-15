import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { DuplicadosAlert } from '@/components/despensa';
import { Producto, ProductoInput } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';
import { getCategoriaConfig } from '@/utils/categoriaConfig';
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
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function FormProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esEdicion = !!id;

  const { productos, añadirProducto, editarProducto, isLoading } = useDespensaStore();

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('unidades');
  const [categoria, setCategoria] = useState('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [fechaCompra, setFechaCompra] = useState('');
  const [marca, setMarca] = useState('');
  const [notas, setNotas] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [duplicadosVisible, setDuplicadosVisible] = useState(false);
  const [duplicados, setDuplicados] = useState<Producto[]>([]);
  const [pendingDatos, setPendingDatos] = useState<ProductoInput | null>(null);

  useEffect(() => {
    if (esEdicion) {
      const p = productos.find((x) => x.id === id);
      if (p) {
        setNombre(p.nombre);
        setCantidad(String(p.cantidad));
        setUnidad(p.unidad);
        setCategoria(p.categoria ?? '');
        setFechaCaducidad(p.fechaCaducidad ?? '');
        setFechaCompra(p.fechaCompra ?? '');
        setMarca(p.marca ?? '');
        setNotas(p.notas ?? '');
        setStockMinimo(p.stockMinimo != null ? String(p.stockMinimo) : '');
      }
    }
  }, [id]);

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
    const cant = parseFloat(cantidad);
    if (!cantidad || isNaN(cant) || cant < 0) e.cantidad = 'Cantidad válida requerida';
    if (!unidad) e.unidad = 'Selecciona una unidad';
    if (fechaCaducidad && !DATE_REGEX.test(fechaCaducidad))
      e.fechaCaducidad = 'Formato AAAA-MM-DD';
    if (fechaCompra && !DATE_REGEX.test(fechaCompra))
      e.fechaCompra = 'Formato AAAA-MM-DD';
    if (stockMinimo) {
      const sm = parseInt(stockMinimo, 10);
      if (isNaN(sm) || sm < 1) e.stockMinimo = 'Debe ser un número entero positivo';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const buildDatos = (): ProductoInput => ({
    nombre: nombre.trim(),
    cantidad: parseFloat(cantidad),
    unidad,
    categoria: categoria || undefined,
    fechaCaducidad: fechaCaducidad || undefined,
    fechaCompra: fechaCompra || undefined,
    marca: marca.trim() || undefined,
    notas: notas.trim() || undefined,
    stockMinimo: stockMinimo ? parseInt(stockMinimo, 10) : undefined,
  });

  const handleGuardar = async () => {
    if (!validar()) return;
    const datos = buildDatos();
    try {
      if (esEdicion) {
        await editarProducto(id!, datos);
        router.back();
      } else {
        const nuevo = await añadirProducto(datos);
        if (nuevo.posiblesDuplicados && nuevo.posiblesDuplicados.length > 0) {
          setDuplicados(nuevo.posiblesDuplicados);
          setPendingDatos(datos);
          setDuplicadosVisible(true);
        } else {
          router.back();
        }
      }
    } catch {
      // error shown via store
    }
  };

  const handleActualizarExistente = async (existente: Producto) => {
    setDuplicadosVisible(false);
    if (!pendingDatos) return;
    const delta = pendingDatos.cantidad;
    const { actualizarCantidad } = useDespensaStore.getState();
    await actualizarCantidad(existente.id, delta);
    router.back();
  };

  const hayErrores = Object.values(errores).some((v) => !!v);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.titulo}>
            {esEdicion ? 'Editar producto' : 'Nuevo producto'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre */}
          <Campo label="Nombre *" error={errores.nombre}>
            <TextInput
              style={[styles.input, errores.nombre && styles.inputError]}
              value={nombre}
              onChangeText={(t) => { setNombre(t); setErrores((e) => ({ ...e, nombre: '' })); }}
              placeholder="ej. Leche entera"
              placeholderTextColor={colors.grayMid}
            />
          </Campo>

          {/* Cantidad */}
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

          {/* Unidad */}
          <Campo label="Unidad *" error={errores.unidad}>
            <ChipSelector opciones={UNIDADES} valor={unidad} onSelect={setUnidad} />
          </Campo>

          {/* Categoría */}
          <Campo label="Categoría">
            <ChipSelector
              opciones={CATEGORIAS}
              valor={categoria}
              onSelect={setCategoria}
              nullable
              getAccentColor={(op) => getCategoriaConfig(op)}
            />
          </Campo>

          {/* Fecha caducidad */}
          <Campo label="Fecha caducidad" error={errores.fechaCaducidad} hint="AAAA-MM-DD">
            <TextInput
              style={[styles.input, errores.fechaCaducidad && styles.inputError]}
              value={fechaCaducidad}
              onChangeText={setFechaCaducidad}
              placeholder="2026-12-31"
              placeholderTextColor={colors.grayMid}
              keyboardType="numbers-and-punctuation"
            />
          </Campo>

          {/* Fecha compra */}
          <Campo label="Fecha compra" error={errores.fechaCompra} hint="AAAA-MM-DD">
            <TextInput
              style={[styles.input, errores.fechaCompra && styles.inputError]}
              value={fechaCompra}
              onChangeText={setFechaCompra}
              placeholder="2026-06-01"
              placeholderTextColor={colors.grayMid}
              keyboardType="numbers-and-punctuation"
            />
          </Campo>

          {/* Marca */}
          <Campo label="Marca">
            <TextInput
              style={styles.input}
              value={marca}
              onChangeText={setMarca}
              placeholder="ej. Hacendado"
              placeholderTextColor={colors.grayMid}
            />
          </Campo>

          {/* Notas */}
          <Campo label="Notas">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notas}
              onChangeText={setNotas}
              placeholder="Notas adicionales..."
              placeholderTextColor={colors.grayMid}
              multiline
              numberOfLines={3}
            />
          </Campo>

          {/* Stock mínimo */}
          <Campo
            label="Stock mínimo personalizado"
            error={errores.stockMinimo}
            hint="Deja vacío para usar el umbral global de tus preferencias"
          >
            <TextInput
              style={[styles.input, errores.stockMinimo && styles.inputError]}
              value={stockMinimo}
              onChangeText={(t) => { setStockMinimo(t); setErrores((e) => ({ ...e, stockMinimo: '' })); }}
              placeholder="ej. 3"
              placeholderTextColor={colors.grayMid}
              keyboardType="number-pad"
            />
          </Campo>

          {/* Botón guardar */}
          <Pressable
            style={[styles.btnGuardar, isLoading && styles.btnDisabled]}
            onPress={handleGuardar}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.btnGuardarText}>
                {esEdicion ? 'Guardar cambios' : 'Añadir producto'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <DuplicadosAlert
        visible={duplicadosVisible}
        duplicados={duplicados}
        onAñadirIgualmente={() => { setDuplicadosVisible(false); router.back(); }}
        onActualizarExistente={handleActualizarExistente}
        onCancelar={() => setDuplicadosVisible(false)}
      />
    </SafeAreaView>
  );
}

function Campo({
  label, error, hint, children,
}: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <View style={campoStyles.container}>
      <Text style={campoStyles.label}>{label}</Text>
      {hint && <Text style={campoStyles.hint}>{hint}</Text>}
      {children}
      {error ? <Text style={campoStyles.error}>{error}</Text> : null}
    </View>
  );
}

function ChipSelector({
  opciones, valor, onSelect, nullable = false, getAccentColor,
}: {
  opciones: string[];
  valor: string;
  onSelect: (v: string) => void;
  nullable?: boolean;
  getAccentColor?: (op: string) => { bg: string; fg: string } | undefined;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg }}>
        {opciones.map((op) => {
          const activo = valor === op;
          const accent = activo && getAccentColor ? getAccentColor(op) : undefined;
          return (
            <Pressable
              key={op}
              style={[
                chipStyles.chip,
                activo && (accent
                  ? { backgroundColor: accent.bg, borderColor: accent.fg }
                  : chipStyles.chipActivo),
              ]}
              onPress={() => onSelect(nullable && activo ? '' : op)}
            >
              <Text style={[
                chipStyles.text,
                activo && (accent
                  ? { color: accent.fg, fontWeight: '700' }
                  : chipStyles.textActivo),
              ]}>
                {op}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  titulo: { ...typography.heading2, color: colors.text.primary },
  form: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 48,
  },
  inputError: { borderColor: colors.error },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnGuardarText: { ...typography.button, color: colors.white },
});

const campoStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  hint: { ...typography.caption, color: colors.text.secondary },
  error: { ...typography.caption, color: colors.error },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActivo: { backgroundColor: '#E8F5D0', borderColor: colors.primary },
  text: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
  textActivo: { color: colors.primaryDark, fontWeight: '700' },
});
