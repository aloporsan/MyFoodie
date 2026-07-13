import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { PreferenciaChip } from '@/components/perfil/PreferenciaChip';
import { useDespensaStore } from '@/store/despensaStore';
import { usePerfilStore } from '@/store/perfilStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

const TIPOS_DIETA = ['Ninguna', 'Vegetariana', 'Vegana', 'Sin gluten', 'Sin lactosa', 'Keto', 'Mediterránea'];
const ALERGIAS_OPCIONES = ['Gluten', 'Lactosa', 'Huevo', 'Frutos secos', 'Marisco', 'Soja', 'Sésamo', 'Mostaza'];
const NIVELES = ['Cualquiera', 'Fácil', 'Media', 'Difícil'];
const TIEMPO_MIN = 15;
const TIEMPO_MAX = 120;
const TIEMPO_PASO = 5;
const STOCK_MIN = 1;
const STOCK_MAX = 20;

type SeccionIcono = React.ComponentProps<typeof Ionicons>['name'];

export function PreferenciasScreen() {
  const router = useRouter();
  const { preferencias, isLoading, actualizarPreferencias } = usePerfilStore();
  const cargarProductos = useDespensaStore((s) => s.cargarProductos);

  const [tipoDieta, setTipoDieta] = useState(preferencias?.tipoDieta ?? 'Ninguna');
  const [alergias, setAlergias] = useState<string[]>(preferencias?.alergias ?? []);
  const [ingredientesNoDeseados, setIngredientesNoDeseados] = useState<string[]>(
    preferencias?.ingredientesNoDeseados ?? [],
  );
  const [nivelDificultad, setNivelDificultad] = useState(
    preferencias?.nivelDificultad ?? 'Cualquiera',
  );
  const [tiempoCoccionMax, setTiempoCoccionMax] = useState(
    preferencias?.tiempoCoccionMax ?? TIEMPO_MAX,
  );
  const [stockMinimoGlobal, setStockMinimoGlobal] = useState(
    preferencias?.stockMinimoGlobal ?? STOCK_MIN,
  );
  const [ingredienteInput, setIngredienteInput] = useState('');
  const [guardado, setGuardado] = useState(false);
  const opacidadToast = useRef(new Animated.Value(0)).current;

  const toggleAlergia = (alergia: string) => {
    setAlergias((prev) =>
      prev.includes(alergia) ? prev.filter((a) => a !== alergia) : [...prev, alergia],
    );
  };

  const agregarIngrediente = () => {
    const val = ingredienteInput.trim();
    if (!val || ingredientesNoDeseados.includes(val)) return;
    setIngredientesNoDeseados((prev) => [...prev, val]);
    setIngredienteInput('');
  };

  const quitarIngrediente = (ing: string) => {
    setIngredientesNoDeseados((prev) => prev.filter((i) => i !== ing));
  };

  const ajustarTiempo = (delta: number) => {
    setTiempoCoccionMax((prev) =>
      Math.min(TIEMPO_MAX, Math.max(TIEMPO_MIN, prev + delta)),
    );
  };

  const ajustarStock = (delta: number) => {
    setStockMinimoGlobal((prev) =>
      Math.min(STOCK_MAX, Math.max(STOCK_MIN, prev + delta)),
    );
  };

  const mostrarToast = () => {
    Animated.sequence([
      Animated.timing(opacidadToast, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacidadToast, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setGuardado(false));
  };

  const handleGuardar = async () => {
    try {
      await actualizarPreferencias({
        tipoDieta: tipoDieta === 'Ninguna' ? null : tipoDieta,
        alergias: alergias.length > 0 ? alergias : null,
        ingredientesNoDeseados: ingredientesNoDeseados.length > 0 ? ingredientesNoDeseados : null,
        nivelDificultad: nivelDificultad === 'Cualquiera' ? null : nivelDificultad,
        tiempoCoccionMax: tiempoCoccionMax === TIEMPO_MAX ? null : tiempoCoccionMax,
        stockMinimoGlobal,
      });
      setGuardado(true);
      mostrarToast();
      cargarProductos();
    } catch {
      // error queda en el store
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Preferencias</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Tipo de dieta */}
          <Seccion
            icono="nutrition-outline"
            color={colors.primary}
            titulo="Tipo de dieta"
            descripcion="Selecciona tu dieta principal"
          >
            <View style={styles.chips}>
              {TIPOS_DIETA.map((dieta) => (
                <PreferenciaChip
                  key={dieta}
                  label={dieta}
                  activo={tipoDieta === dieta}
                  onPress={() => setTipoDieta(dieta)}
                />
              ))}
            </View>
          </Seccion>

          {/* Cosas a evitar: alergias + ingredientes fusionados */}
          <Seccion
            icono="ban-outline"
            color={colors.secondary}
            titulo="Cosas a evitar"
            descripcion="Alergias, intolerancias e ingredientes que no quieres"
          >
            <Text style={styles.subLabel}>Alergias comunes</Text>
            <View style={[styles.chips, { marginBottom: spacing.sm }]}>
              {ALERGIAS_OPCIONES.map((alergia) => (
                <PreferenciaChip
                  key={alergia}
                  label={alergia}
                  activo={alergias.includes(alergia)}
                  onPress={() => toggleAlergia(alergia)}
                />
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={[styles.subLabel, { marginTop: spacing.md }]}>
              Ingredientes específicos
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.ingredienteInput}
                value={ingredienteInput}
                onChangeText={setIngredienteInput}
                placeholder="Ej: cilantro, anchoas..."
                placeholderTextColor={colors.grayMid}
                onSubmitEditing={agregarIngrediente}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.addBtn, !ingredienteInput.trim() && styles.addBtnDisabled]}
                onPress={agregarIngrediente}
                disabled={!ingredienteInput.trim()}
              >
                <Ionicons name="add" size={20} color={colors.white} />
              </Pressable>
            </View>
            {ingredientesNoDeseados.length > 0 && (
              <View style={[styles.chips, { marginTop: spacing.md }]}>
                {ingredientesNoDeseados.map((ing) => (
                  <Pressable
                    key={ing}
                    style={styles.chipRemovible}
                    onPress={() => quitarIngrediente(ing)}
                  >
                    <Text style={styles.chipRemovibleTexto}>{ing}</Text>
                    <Ionicons name="close" size={14} color={colors.secondary} />
                  </Pressable>
                ))}
              </View>
            )}
          </Seccion>

          {/* Nivel de dificultad */}
          <Seccion
            icono="flag-outline"
            color="#F8B133"
            titulo="Nivel de dificultad"
            descripcion="Filtra las recetas por su nivel de dificultad"
          >
            <View style={styles.chips}>
              {NIVELES.map((nivel) => (
                <PreferenciaChip
                  key={nivel}
                  label={nivel}
                  activo={nivelDificultad === nivel}
                  onPress={() => setNivelDificultad(nivel)}
                />
              ))}
            </View>
          </Seccion>

          {/* Tiempo de cocción */}
          <Seccion
            icono="time-outline"
            color={colors.primaryDark}
            titulo="Tiempo máximo de cocción"
            descripcion="Recetas que puedas preparar en ese tiempo"
          >
            <View style={styles.tiempoControl}>
              <Pressable
                style={[
                  styles.tiempoBtn,
                  tiempoCoccionMax <= TIEMPO_MIN && styles.tiempoBtnDisabled,
                ]}
                onPress={() => ajustarTiempo(-TIEMPO_PASO)}
                disabled={tiempoCoccionMax <= TIEMPO_MIN}
              >
                <Ionicons
                  name="remove"
                  size={22}
                  color={tiempoCoccionMax <= TIEMPO_MIN ? colors.grayMid : colors.primaryDark}
                />
              </Pressable>
              <View style={styles.tiempoDisplay}>
                <Text style={styles.tiempoValor}>
                  {tiempoCoccionMax === TIEMPO_MAX ? 'Sin límite' : `${tiempoCoccionMax}`}
                </Text>
                {tiempoCoccionMax < TIEMPO_MAX && (
                  <Text style={styles.tiempoUnidad}>minutos</Text>
                )}
              </View>
              <Pressable
                style={[
                  styles.tiempoBtn,
                  tiempoCoccionMax >= TIEMPO_MAX && styles.tiempoBtnDisabled,
                ]}
                onPress={() => ajustarTiempo(TIEMPO_PASO)}
                disabled={tiempoCoccionMax >= TIEMPO_MAX}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={tiempoCoccionMax >= TIEMPO_MAX ? colors.grayMid : colors.primaryDark}
                />
              </Pressable>
            </View>
          </Seccion>

          {/* Stock mínimo global */}
          <Seccion
            icono="cart-outline"
            color={colors.error}
            titulo="Stock mínimo global"
            descripcion="Cantidad mínima por defecto para la alerta de reposición"
          >
            <View style={styles.tiempoControl}>
              <Pressable
                style={[
                  styles.tiempoBtn,
                  { borderColor: stockMinimoGlobal <= STOCK_MIN ? colors.grayMid : colors.error },
                ]}
                onPress={() => ajustarStock(-1)}
                disabled={stockMinimoGlobal <= STOCK_MIN}
              >
                <Ionicons
                  name="remove"
                  size={22}
                  color={stockMinimoGlobal <= STOCK_MIN ? colors.grayMid : colors.error}
                />
              </Pressable>
              <View style={styles.tiempoDisplay}>
                <Text style={styles.tiempoValor}>{stockMinimoGlobal}</Text>
                <Text style={styles.tiempoUnidad}>unidades</Text>
              </View>
              <Pressable
                style={[
                  styles.tiempoBtn,
                  { borderColor: stockMinimoGlobal >= STOCK_MAX ? colors.grayMid : colors.error },
                ]}
                onPress={() => ajustarStock(1)}
                disabled={stockMinimoGlobal >= STOCK_MAX}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={stockMinimoGlobal >= STOCK_MAX ? colors.grayMid : colors.error}
                />
              </Pressable>
            </View>
          </Seccion>

          <Pressable
            style={[styles.guardarBtn, isLoading && styles.guardarBtnDisabled]}
            onPress={handleGuardar}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.guardarTexto}>Guardar preferencias</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {guardado && (
        <Animated.View style={[styles.toast, { opacity: opacidadToast }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.white} />
          <Text style={styles.toastTexto}>Preferencias guardadas</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function Seccion({
  icono,
  color,
  titulo,
  descripcion,
  children,
}: {
  icono: SeccionIcono;
  color: string;
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <View style={seccionStyles.wrapper}>
      <View style={seccionStyles.headerRow}>
        <View style={[seccionStyles.iconoWrapper, { backgroundColor: color + '20' }]}>
          <Ionicons name={icono} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={seccionStyles.titulo}>{titulo}</Text>
          <Text style={seccionStyles.descripcion}>{descripcion}</Text>
        </View>
      </View>
      <View style={[seccionStyles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
        {children}
      </View>
    </View>
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
    borderBottomColor: colors.grayLight,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { ...typography.heading3, color: colors.text.primary },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  subLabel: {
    ...typography.caption,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  ingredienteInput: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderWidth: 1.5,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: colors.grayMid },
  chipRemovible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary + '15',
    borderWidth: 1,
    borderColor: colors.secondary + '40',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipRemovibleTexto: { ...typography.label, color: colors.secondary },
  tiempoControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  tiempoBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiempoBtnDisabled: { borderColor: colors.grayMid },
  tiempoDisplay: { minWidth: 110, alignItems: 'center' },
  tiempoValor: { ...typography.heading2, color: colors.text.primary },
  tiempoUnidad: { ...typography.caption, color: colors.text.secondary },
  guardarBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  guardarBtnDisabled: { backgroundColor: colors.grayMid },
  guardarTexto: { ...typography.button, color: colors.white },
  toast: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  toastTexto: { ...typography.label, color: colors.white },
});

const seccionStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconoWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...typography.label, color: colors.text.primary },
  descripcion: { ...typography.caption, color: colors.text.secondary, marginTop: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
});
