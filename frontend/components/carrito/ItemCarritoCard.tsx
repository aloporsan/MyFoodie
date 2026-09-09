import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ItemCarrito, PrioridadCarrito, UNIDADES_CARRITO } from '@/services/carritoService';
import { showConfirm } from '@/hooks/useConfirm';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const UMBRAL_SWIPE = 100;
const DURACION_SALIDA = 200;
const ANCHO_PANTALLA = Dimensions.get('window').width;

const PRIORIDAD_CONFIG: Record<PrioridadCarrito, { bg: string; text: string; label: string }> = {
  alta: { bg: colors.error, text: colors.white, label: 'Alta' },
  media: { bg: colors.secondary, text: colors.white, label: 'Media' },
  baja: { bg: colors.primary, text: colors.white, label: 'Baja' },
};

interface Props {
  item: ItemCarrito;
  onAceptar?: () => void;
  onRechazar?: () => void;
  onNoVolver?: () => void;
  onModificarCantidad?: (cantidad: number, unidad: string) => void;
  onRecuperar?: () => void;
}

function ItemCarritoCardBase({
  item, onAceptar, onRechazar, onNoVolver, onModificarCantidad, onRecuperar,
}: Props) {
  const [modalCantidadVisible, setModalCantidadVisible] = useState(false);
  const [cantidadTexto, setCantidadTexto] = useState(String(item.cantidad));
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(item.unidad);

  const prioridad = PRIORIDAD_CONFIG[item.prioridad];
  const esAceptado = item.estado === 'aceptado';
  const esRechazado = item.estado === 'rechazado';

  const translateX = useSharedValue(0);

  // Igual que el swipe del feed: la tarjeta sigue al dedo 1:1 y, al soltar pasado el umbral,
  // se desliza hasta salir de la pantalla; solo entonces se dispara la acción (aceptar /
  // rechazar), para que se vea salir del todo antes de desmontarse.
  const animarSalida = (direccion: 1 | -1, alTerminar?: () => void) => {
    translateX.value = withTiming(
      direccion * ANCHO_PANTALLA,
      { duration: DURACION_SALIDA },
      (finished) => {
        if (finished && alTerminar) runOnJS(alTerminar)();
      },
    );
  };

  const handleAceptar = () => {
    if (esAceptado) return;
    animarSalida(1, onAceptar);
  };

  const handleRechazar = () => {
    if (esRechazado) return;
    animarSalida(-1, onRechazar);
  };

  // activeOffsetX deja pasar el gesto vertical al ScrollView/FlatList mientras no
  // haya un desplazamiento horizontal claro (evita robar el scroll de la lista).
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > UMBRAL_SWIPE && !esAceptado) {
        runOnJS(handleAceptar)();
      } else if (event.translationX < -UMBRAL_SWIPE && !esRechazado) {
        runOnJS(handleRechazar)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayAceptarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  const overlayRechazarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(-translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  const handleMasOpciones = () => {
    showConfirm('Más opciones', undefined, [
      {
        text: 'Modificar cantidad',
        onPress: () => {
          setCantidadTexto(String(item.cantidad));
          setUnidadSeleccionada(item.unidad);
          setModalCantidadVisible(true);
        },
      },
      { text: 'No volver a recomendar', style: 'destructive', onPress: onNoVolver },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const ajustarCantidad = (delta: number) => {
    const actual = parseFloat(cantidadTexto) || 0;
    setCantidadTexto(String(Math.max(0, actual + delta)));
  };

  const guardarCantidad = () => {
    const valor = parseFloat(cantidadTexto);
    if (!isNaN(valor) && valor > 0) {
      onModificarCantidad?.(valor, unidadSeleccionada);
    }
    setModalCantidadVisible(false);
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.wrapper, cardAnimStyle]}>
        <View style={[styles.card, esAceptado && styles.cardAceptado, esRechazado && styles.cardRechazado]}>
          <View style={styles.row}>
            <View style={styles.info}>
              <View style={styles.nombreRow}>
                <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
                <View style={[styles.badge, { backgroundColor: prioridad.bg }]}>
                  <Text style={[styles.badgeText, { color: prioridad.text }]}>{prioridad.label}</Text>
                </View>
              </View>

              <Text style={styles.detalle}>
                {item.cantidad} {item.unidad}
                {item.categoria ? ` · ${item.categoria}` : ''}
              </Text>

              {item.motivo && <Text style={styles.motivo} numberOfLines={2}>{item.motivo}</Text>}

              {item.recetaTitulo && (
                <View style={styles.recetaChip}>
                  <Ionicons name="restaurant-outline" size={12} color={colors.primaryDark} />
                  <Text style={styles.recetaChipText} numberOfLines={1}>{item.recetaTitulo}</Text>
                </View>
              )}
            </View>
          </View>

          {esAceptado ? (
            <View style={styles.actions}>
              <Pressable style={styles.btnCambiarRechazado} onPress={handleRechazar}>
                <Ionicons name="close-circle-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.btnCambiarRechazadoText}>Cambiar a rechazado</Text>
              </Pressable>
            </View>
          ) : esRechazado ? (
            onRecuperar && (
              <View style={styles.actions}>
                <Pressable style={styles.btnRecuperar} onPress={onRecuperar}>
                  <Ionicons name="refresh" size={16} color={colors.primaryDark} />
                  <Text style={styles.btnRecuperarText}>Recuperar</Text>
                </Pressable>
              </View>
            )
          ) : (
            <View style={styles.actionsPendiente}>
              <View style={styles.swipeHint}>
                <Ionicons name="chevron-back" size={14} color={colors.error} />
                <Text style={styles.swipeHintTextRechazar}>Descartar</Text>
                <Text style={styles.swipeHintDivider}>·</Text>
                <Text style={styles.swipeHintTextAceptar}>Aceptar</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
              </View>
              <Pressable style={[styles.actionBtn, styles.btnMas]} onPress={handleMasOpciones} hitSlop={4}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.text.secondary} />
              </Pressable>
            </View>
          )}

          <Animated.View
            testID="overlay-aceptar-carrito"
            style={[styles.overlay, styles.overlayAceptar, overlayAceptarStyle]}
            pointerEvents="none"
          >
            <Ionicons name="checkmark-circle" size={40} color={colors.white} />
          </Animated.View>

          <Animated.View
            testID="overlay-rechazar-carrito"
            style={[styles.overlay, styles.overlayRechazar, overlayRechazarStyle]}
            pointerEvents="none"
          >
            <Ionicons name="close-circle" size={40} color={colors.white} />
          </Animated.View>
        </View>

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
            <Text style={styles.modalNombre} numberOfLines={1}>{item.nombre}</Text>

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
              <Pressable style={styles.btnGuardar} onPress={guardarCantidad}>
                <Text style={styles.btnGuardarText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </Animated.View>
    </GestureDetector>
  );
}

// Memo por identidad del item: al aceptar/rechazar uno se re-renderiza toda la lista, y
// repintar las tarjetas cuyo item no cambió es lo que se nota como tirón en móviles con
// poca RAM. Los callbacks se ignoran a propósito: son flechas nuevas en cada render pero
// cierran sobre un item.id estable y sobre funciones estables del store.
export const ItemCarritoCard = memo(ItemCarritoCardBase, (prev, next) => prev.item === next.item);

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  overlayAceptar: {
    backgroundColor: 'rgba(127, 198, 42, 0.75)',
  },
  overlayRechazar: {
    backgroundColor: 'rgba(229, 57, 53, 0.75)',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAceptado: {
    backgroundColor: '#E8F5D0',
  },
  cardRechazado: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nombre: {
    ...typography.label,
    color: colors.text.primary,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xl,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  detalle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  motivo: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  recetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  recetaChipText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsPendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swipeHintTextRechazar: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  swipeHintTextAceptar: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  swipeHintDivider: {
    ...typography.caption,
    color: colors.text.secondary,
    marginHorizontal: 2,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMas: {
    backgroundColor: colors.grayLight,
  },
  btnCambiarRechazado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  btnCambiarRechazadoText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  btnRecuperar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  btnRecuperarText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
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
  modalTitulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
  },
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
  campoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  chipsScroll: {
    marginBottom: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActivo: {
    backgroundColor: '#E8F5D0',
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  chipTextActivo: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  modalBotones: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
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
});
