import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ItemCarrito, ItemCarritoInput } from '@/services/carritoService';
import { MatchItemCarrito, matchingService } from '@/services/matchingService';
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

// Debounce del preview de matching: evita disparar una petición en cada pulsación de tecla.
const DEBOUNCE_MATCHING_MS = 400;
const LONGITUD_MINIMA_BUSQUEDA = 2;

interface Props {
  onAñadir: (datos: ItemCarritoInput) => Promise<void>;
  onActualizarExistente: (itemExistente: ItemCarrito, cantidadASumar: number) => Promise<void>;
  isLoading?: boolean;
}

export function FormItemManual({ onAñadir, onActualizarExistente, isLoading = false }: Props) {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('unidades');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<MatchItemCarrito[]>([]);
  const [actualizandoExistente, setActualizandoExistente] = useState(false);

  const mejorMatch = matches[0] ?? null;

  // Vista previa de matching: mientras el usuario escribe el nombre, consulta si ya hay
  // algo similar en el carrito para poder proponer fusionar en vez de duplicar.
  useEffect(() => {
    const nombreBuscado = nombre.trim();
    if (nombreBuscado.length < LONGITUD_MINIMA_BUSQUEDA) {
      setMatches([]);
      return;
    }
    const timeoutId = setTimeout(() => {
      matchingService.buscarItemSimilarEnCarrito(nombreBuscado)
        .then(setMatches)
        .catch(() => setMatches([]));
    }, DEBOUNCE_MATCHING_MS);
    return () => clearTimeout(timeoutId);
  }, [nombre]);

  const limpiarFormulario = () => {
    setNombre('');
    setCantidad('');
    setCategoria(null);
    setErrores({});
    setMatches([]);
  };

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
    limpiarFormulario();
  };

  const handleActualizarExistente = async () => {
    if (!mejorMatch || !validar()) return;
    setActualizandoExistente(true);
    try {
      await onActualizarExistente(mejorMatch.item, parseFloat(cantidad));
      limpiarFormulario();
    } finally {
      setActualizandoExistente(false);
    }
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

      {mejorMatch && (
        <View style={styles.sugerenciaBox}>
          <Text style={styles.sugerenciaTitulo}>Ya tienes algo similar en tu lista:</Text>
          <Text style={styles.sugerenciaItem}>
            {mejorMatch.item.nombre} · {mejorMatch.item.cantidad} {mejorMatch.item.unidad}
          </Text>

          {mejorMatch.tipoMatch === 'AUTOMATICO' ? (
            <Pressable
              style={[styles.sugerenciaBtnPrimario, actualizandoExistente && styles.btnDisabled]}
              onPress={handleActualizarExistente}
              disabled={actualizandoExistente || isLoading}
            >
              {actualizandoExistente ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sugerenciaBtnPrimarioText}>Actualizar cantidad</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.sugerenciaBotonesRow}>
              <Pressable
                style={[styles.sugerenciaBtnSecundario, isLoading && styles.btnDisabled]}
                onPress={handleAñadir}
                disabled={isLoading || actualizandoExistente}
              >
                <Text style={styles.sugerenciaBtnSecundarioText}>Añadir igualmente</Text>
              </Pressable>
              <Pressable
                style={[styles.sugerenciaBtnPrimario, styles.flexGrow, actualizandoExistente && styles.btnDisabled]}
                onPress={handleActualizarExistente}
                disabled={actualizandoExistente || isLoading}
              >
                {actualizandoExistente ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.sugerenciaBtnPrimarioText}>Actualizar cantidad del existente</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

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
  sugerenciaBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  sugerenciaTitulo: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  sugerenciaItem: { ...typography.body, color: colors.text.primary },
  sugerenciaBotonesRow: { flexDirection: 'row', gap: spacing.sm },
  sugerenciaBtnPrimario: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  sugerenciaBtnPrimarioText: { ...typography.label, color: colors.white, fontSize: 12 },
  sugerenciaBtnSecundario: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  sugerenciaBtnSecundarioText: { ...typography.label, color: colors.secondary, fontSize: 12 },
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
