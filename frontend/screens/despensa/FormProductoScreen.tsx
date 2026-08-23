import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
import { AvisoConversionUnidad } from '@/components/common/AvisoConversionUnidad';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { DuplicadosAlert } from '@/components/despensa';
import { Producto, ProductoInput } from '@/services/despensaService';
import { MatchProducto } from '@/services/matchingService';
import { useDespensaStore } from '@/store/despensaStore';
import { getCategoriaConfig } from '@/utils/categoriaConfig';
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

const CATEGORIAS = [
  'Frutas y verduras', 'Carnes', 'Pescados', 'Lácteos',
  'Bebidas', 'Congelados', 'Condimentos', 'Cereales',
  'Conservas', 'Snacks', 'Otros',
];

const DEBOUNCE_BUSQUEDA_MS = 500;
const LONGITUD_MINIMA_BUSQUEDA = 2;

function dateToApi(d: Date): string {
  return d.toISOString().split('T')[0];
}

function apiToDisplay(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function FormProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const esEdicion = !!id;

  const {
    productos,
    añadirProducto,
    editarProducto,
    actualizarCantidad,
    isLoading,
    similaresSugeridos,
    buscarSimilares,
    limpiarSimilares,
  } = useDespensaStore();

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('unidad');
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
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [sugerenciasDescartadas, setSugerenciasDescartadas] = useState(false);

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

  // La búsqueda de similares nunca decide por el usuario: solo se muestra como sugerencia
  // y hace falta tocarla para aceptarla. Así nunca se bloquea el campo mientras se sigue
  // escribiendo (p.ej. "aceitunas" ya matchea algo mientras el usuario termina de escribir
  // "aceitunas gordales").
  useEffect(() => {
    if (esEdicion || productoSeleccionado || sugerenciasDescartadas) return;
    const texto = nombre.trim();
    if (texto.length < LONGITUD_MINIMA_BUSQUEDA) {
      limpiarSimilares();
      return;
    }
    const timer = setTimeout(() => buscarSimilares(texto), DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(timer);
  }, [nombre, esEdicion, productoSeleccionado, sugerenciasDescartadas]);

  useEffect(() => () => limpiarSimilares(), []);

  // Ordenamos los AUTOMATICO (>=85%) primero, pero seguimos exigiendo un toque explícito
  // para seleccionarlos: el matching automático lo confirma el usuario, no el sistema.
  const sugerencias = [...similaresSugeridos].sort((a, b) =>
    a.tipoMatch === b.tipoMatch ? 0 : a.tipoMatch === 'AUTOMATICO' ? -1 : 1
  );

  const handleSeleccionarSugerencia = (match: MatchProducto) => {
    setProductoSeleccionado(match.producto);
    limpiarSimilares();
  };

  // Una vez descartadas (por la X del panel o del banner de selección), no se vuelven
  // a proponer para el resto de esta edición: si el usuario dijo que no, se respeta.
  const handleDescartarSugerencias = () => {
    setSugerenciasDescartadas(true);
    limpiarSimilares();
  };

  const handleQuitarSeleccion = () => {
    setProductoSeleccionado(null);
    setSugerenciasDescartadas(true);
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
    const cant = parseFloat(cantidad);
    if (!cantidad || isNaN(cant) || cant < 0) e.cantidad = 'Cantidad válida requerida';
    if (!unidad) e.unidad = 'Selecciona una unidad';
    if (stockMinimo) {
      const sm = parseInt(stockMinimo, 10);
      if (isNaN(sm) || sm < 0) e.stockMinimo = 'Debe ser un número entero positivo o cero';
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
      } else if (productoSeleccionado) {
        await actualizarCantidad(productoSeleccionado.id, datos.cantidad);
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
              editable={!productoSeleccionado}
            />
          </Campo>

          {productoSeleccionado && (
            <View style={sugerenciasStyles.seleccionado}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={sugerenciasStyles.seleccionadoTexto} numberOfLines={1}>
                Actualizando cantidad de &quot;{productoSeleccionado.nombre}&quot;
              </Text>
              <Pressable onPress={handleQuitarSeleccion} hitSlop={8} testID="quitar-seleccion">
                <Ionicons name="close" size={18} color={colors.text.secondary} />
              </Pressable>
            </View>
          )}

          {!productoSeleccionado && sugerencias.length > 0 && (
            <View style={sugerenciasStyles.container}>
              <View style={sugerenciasStyles.cabecera}>
                <Text style={sugerenciasStyles.titulo}>¿Es uno de estos?</Text>
                <Pressable onPress={handleDescartarSugerencias} hitSlop={8} testID="descartar-sugerencias">
                  <Ionicons name="close" size={18} color={colors.text.secondary} />
                </Pressable>
              </View>
              {sugerencias.map((match) => (
                <Pressable
                  key={match.producto.id}
                  style={sugerenciasStyles.item}
                  onPress={() => handleSeleccionarSugerencia(match)}
                >
                  <View style={sugerenciasStyles.itemInfo}>
                    <Text style={sugerenciasStyles.itemNombre} numberOfLines={1}>
                      {match.producto.nombre}
                    </Text>
                    <Text style={sugerenciasStyles.itemDetalle}>{match.textoSugerido}</Text>
                  </View>
                  <Text
                    style={[
                      sugerenciasStyles.itemPorcentaje,
                      match.tipoMatch === 'AUTOMATICO' && sugerenciasStyles.itemPorcentajeAlto,
                    ]}
                  >
                    {Math.round(match.similitud * 100)}%
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

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
            <Text style={styles.grupoUnidadLabel}>Unidades objetivas (recomendadas)</Text>
            <ChipSelector opciones={UNIDADES_OBJETIVAS} valor={unidad} onSelect={setUnidad} getLabel={etiquetaUnidad} />
            <Text style={[styles.grupoUnidadLabel, styles.grupoUnidadLabelSubjetiva]}>
              Unidades subjetivas (se convertirán automáticamente)
            </Text>
            <ChipSelector opciones={UNIDADES_SUBJETIVAS} valor={unidad} onSelect={setUnidad} getLabel={etiquetaUnidad} />
            {esUnidadSubjetiva(unidad) && (
              <AvisoConversionUnidad equivalencia={equivalenciaMetrica(parseFloat(cantidad), unidad) ?? ''} />
            )}
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
          <Campo label="Fecha caducidad">
            <DateFieldInput value={fechaCaducidad} onChange={setFechaCaducidad} />
          </Campo>

          {/* Fecha compra */}
          <Campo label="Fecha compra">
            <DateFieldInput value={fechaCompra} onChange={setFechaCompra} />
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
                {esEdicion
                  ? 'Guardar cambios'
                  : productoSeleccionado
                    ? 'Actualizar cantidad'
                    : 'Añadir producto'}
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

function DateFieldInput({
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
  opciones, valor, onSelect, nullable = false, getAccentColor, getLabel,
}: {
  opciones: string[];
  valor: string;
  onSelect: (v: string) => void;
  nullable?: boolean;
  getAccentColor?: (op: string) => { bg: string; fg: string } | undefined;
  getLabel?: (op: string) => string;
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
                {getLabel ? getLabel(op) : op}
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
  grupoUnidadLabel: { ...typography.caption, color: colors.text.secondary },
  grupoUnidadLabelSubjetiva: { marginTop: spacing.sm },
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

const dateStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  text: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  placeholder: {
    color: colors.grayMid,
  },
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
  doneBtnText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
  },
});

const campoStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  hint: { ...typography.caption, color: colors.text.secondary },
  error: { ...typography.caption, color: colors.error },
});

const sugerenciasStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: { ...typography.label, color: colors.text.primary, marginBottom: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  itemInfo: { flex: 1 },
  itemNombre: { ...typography.label, color: colors.text.primary },
  itemDetalle: { ...typography.caption, color: colors.text.secondary },
  itemPorcentaje: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  itemPorcentajeAlto: { color: colors.secondary },
  seleccionado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  seleccionadoTexto: { ...typography.body, color: colors.text.primary, flex: 1 },
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
