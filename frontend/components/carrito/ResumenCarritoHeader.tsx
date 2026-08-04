import { StyleSheet, Text, View } from 'react-native';
import { CarritoResumen } from '@/services/carritoService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  resumen: CarritoResumen | null;
}

export function ResumenCarritoHeader({ resumen }: Props) {
  const totalItems = resumen?.totalItems ?? 0;
  const itemsAlta = resumen?.itemsAlta ?? 0;
  const itemsAceptados = resumen?.itemsAceptados ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValor}>{totalItems}</Text>
          <Text style={styles.statLabel}>Recomendados</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValor, { color: colors.error }]}>{itemsAlta}</Text>
          <Text style={styles.statLabel}>Prioridad alta</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValor, { color: colors.primaryDark }]}>{itemsAceptados}</Text>
          <Text style={styles.statLabel}>Aceptados</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValor: {
    ...typography.heading2,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
