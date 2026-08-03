import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CarritoResumen } from '@/services/carritoService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  resumen: CarritoResumen | null;
  onPress: () => void;
}

export function CarritoResumenCard({ resumen, onPress }: Props) {
  const itemsAlta = resumen?.itemsAlta ?? 0;
  const itemsAceptados = resumen?.itemsAceptados ?? 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Ionicons name="cart-outline" size={28} color={colors.primaryDark} />
        </View>
        <View style={styles.texto}>
          <Text style={styles.titulo}>Carrito inteligente</Text>
          <Text style={styles.descripcion}>
            {itemsAlta > 0
              ? `${itemsAlta} producto${itemsAlta !== 1 ? 's' : ''} de prioridad alta`
              : 'Sugerencias de compra basadas en tu despensa'}
          </Text>
          {itemsAceptados > 0 && (
            <Text style={styles.aceptadosTexto}>
              {itemsAceptados} producto{itemsAceptados !== 1 ? 's' : ''} aceptado
              {itemsAceptados !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {itemsAlta > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{itemsAlta}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.grayMid} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texto: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    ...typography.label,
    color: colors.text.primary,
  },
  descripcion: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  aceptadosTexto: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
});
