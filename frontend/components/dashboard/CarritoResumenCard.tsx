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
          <Ionicons name="cart" size={26} color={colors.white} />
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
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: colors.white,
    fontWeight: '700',
  },
  descripcion: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  aceptadosTexto: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
});
