import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ItemCarrito, PrioridadCarrito } from '@/services/carritoService';
import { showConfirm } from '@/hooks/useConfirm';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

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
  onModificarCantidad?: (cantidad: number) => void;
  onRecuperar?: () => void;
}

export function ItemCarritoCard({
  item, onAceptar, onRechazar, onNoVolver, onModificarCantidad, onRecuperar,
}: Props) {
  const [modalCantidadVisible, setModalCantidadVisible] = useState(false);
  const [cantidadTexto, setCantidadTexto] = useState(String(item.cantidad));

  const prioridad = PRIORIDAD_CONFIG[item.prioridad];
  const esAceptado = item.estado === 'aceptado';
  const esRechazado = item.estado === 'rechazado';

  const handleMasOpciones = () => {
    showConfirm('Más opciones', undefined, [
      {
        text: 'Modificar cantidad',
        onPress: () => {
          setCantidadTexto(String(item.cantidad));
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
      onModificarCantidad?.(valor);
    }
    setModalCantidadVisible(false);
  };

  return (
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
          <Pressable style={styles.btnCambiarRechazado} onPress={onRechazar}>
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
        <View style={styles.actions}>
          <Pressable style={[styles.actionBtn, styles.btnAceptar]} onPress={onAceptar} hitSlop={4}>
            <Ionicons name="checkmark" size={18} color={colors.white} />
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.btnRechazar]} onPress={onRechazar} hitSlop={4}>
            <Ionicons name="close" size={18} color={colors.text.secondary} />
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.btnMas]} onPress={handleMasOpciones} hitSlop={4}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.text.secondary} />
          </Pressable>
        </View>
      )}

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
              <Text style={styles.modalUnidadText}>{item.unidad}</Text>
              <Pressable style={styles.stepperBtn} onPress={() => ajustarCantidad(1)} hitSlop={8}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>
            </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
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
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAceptar: {
    backgroundColor: colors.primary,
  },
  btnRechazar: {
    backgroundColor: colors.grayLight,
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
  modalUnidadText: {
    ...typography.body,
    color: colors.text.secondary,
    minWidth: 40,
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
