import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [editandoCantidad, setEditandoCantidad] = useState(false);
  const [cantidadTexto, setCantidadTexto] = useState(String(item.cantidad));

  const prioridad = PRIORIDAD_CONFIG[item.prioridad];
  const esAceptado = item.estado === 'aceptado';
  const esRechazado = item.estado === 'rechazado';

  const handleMasOpciones = () => {
    showConfirm('Más opciones', undefined, [
      { text: 'Modificar cantidad', onPress: () => setEditandoCantidad(true) },
      { text: 'No volver a recomendar', style: 'destructive', onPress: onNoVolver },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const guardarCantidad = () => {
    const valor = parseFloat(cantidadTexto);
    if (!isNaN(valor) && valor > 0) {
      onModificarCantidad?.(valor);
    }
    setEditandoCantidad(false);
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

      {editandoCantidad ? (
        <View style={styles.editCantidadRow}>
          <TextInput
            style={styles.cantidadInput}
            value={cantidadTexto}
            onChangeText={setCantidadTexto}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
          />
          <Text style={styles.unidadText}>{item.unidad}</Text>
          <Pressable style={styles.btnGuardarCantidad} onPress={guardarCantidad}>
            <Text style={styles.btnGuardarCantidadText}>Guardar</Text>
          </Pressable>
          <Pressable onPress={() => setEditandoCantidad(false)} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>
      ) : esAceptado ? (
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
  editCantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cantidadInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    width: 70,
    textAlign: 'center',
  },
  unidadText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  btnGuardarCantidad: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  btnGuardarCantidadText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
