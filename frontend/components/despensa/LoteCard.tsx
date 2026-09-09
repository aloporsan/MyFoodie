import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LoteProducto } from '@/services/loteService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { ProductoEstadoBadge } from './ProductoEstadoBadge';

function formatFecha(fecha?: string): string | null {
  if (!fecha) return null;
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

function formatDias(dias: number | null | undefined): string | null {
  if (dias == null) return null;
  if (dias < 0) return `Hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
  if (dias === 0) return 'Hoy';
  return `En ${dias} día${dias !== 1 ? 's' : ''}`;
}

interface Props {
  lote: LoteProducto;
  onEditar?: () => void;
  onEliminar?: () => void;
  /** Modo selección (p. ej. elegir a qué lote sumar cantidad): toda la tarjeta es pulsable
   *  y no muestra los iconos de editar/eliminar. */
  onPress?: () => void;
}

export function LoteCard({ lote, onEditar, onEliminar, onPress }: Props) {
  const fechaCaducidadText = formatFecha(lote.fechaCaducidad);
  const diasText = formatDias(lote.diasHastaCaducidad);

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.cantidad}>
            {lote.cantidad} {lote.unidad}
          </Text>
          {fechaCaducidadText && (
            <View style={styles.fechaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.fechaText}>
                Caduca el {fechaCaducidadText}
                {diasText ? ` · ${diasText}` : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.badgeCol}>
          <ProductoEstadoBadge estado={lote.estado} size="sm" />
        </View>
      </View>

      {(onEditar || onEliminar) && (
        <View style={styles.actions}>
          {onEditar && (
            <Pressable style={styles.iconBtn} onPress={onEditar} hitSlop={8}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </Pressable>
          )}
          {onEliminar && (
            <Pressable style={styles.iconBtn} onPress={onEliminar} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  cantidad: { ...typography.label, color: colors.text.primary },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  fechaText: { ...typography.caption, color: colors.text.secondary },
  badgeCol: { alignItems: 'flex-end' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  iconBtn: { padding: spacing.xs },
});
