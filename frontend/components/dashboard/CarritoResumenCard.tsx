import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CarritoResumen } from '@/services/carritoService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  resumen: CarritoResumen | null;
  onPress: () => void;
}

export function CarritoResumenCard({ resumen, onPress }: Props) {
  const totalItems = resumen?.totalItems ?? 0;
  const itemsAlta = resumen?.itemsAlta ?? 0;
  const itemsAceptados = resumen?.itemsAceptados ?? 0;

  const descripcion =
    itemsAlta > 0
      ? `${itemsAlta} de prioridad alta te espera${itemsAlta !== 1 ? 'n' : ''}`
      : totalItems > 0
        ? `${totalItems} sugerencia${totalItems !== 1 ? 's' : ''} lista${totalItems !== 1 ? 's' : ''} para revisar`
        : 'Sugerencias de compra según tu despensa';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      testID="carrito-resumen-card"
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="cart" size={24} color={colors.white} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
            </View>
          )}
        </View>

        <View style={styles.texto}>
          <Text style={styles.titulo}>Carrito inteligente</Text>
          <Text style={styles.descripcion} numberOfLines={2}>
            {descripcion}
          </Text>
          {itemsAceptados > 0 && (
            <View style={styles.aceptadosPill}>
              <Ionicons name="checkmark" size={12} color={colors.primaryDark} />
              <Text style={styles.aceptadosTexto}>
                {itemsAceptados} en tu lista
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="arrow-forward-circle" size={26} color="rgba(255,255,255,0.9)" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
  },
  texto: {
    flex: 1,
    gap: 3,
  },
  titulo: {
    ...typography.label,
    color: colors.white,
  },
  descripcion: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  aceptadosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  aceptadosTexto: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primaryDark,
  },
});
