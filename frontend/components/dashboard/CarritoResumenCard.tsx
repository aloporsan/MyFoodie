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
          <Ionicons name="cart-outline" size={22} color={colors.primaryDark} />
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
        <Ionicons name="chevron-forward" size={18} color={colors.grayMid} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texto: {
    gap: 2,
  },
  titulo: {
    ...typography.label,
    color: colors.text.primary,
    textAlign: 'center',
  },
  descripcion: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  aceptadosTexto: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    textAlign: 'center',
  },
});
