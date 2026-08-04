import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CarritoResumen } from '@/services/carritoService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  resumen: CarritoResumen | null;
  isGenerando?: boolean;
  onRegenerar: () => void;
}

export function ResumenCarritoHeader({ resumen, isGenerando = false, onRegenerar }: Props) {
  const totalItems = resumen?.totalItems ?? 0;
  const itemsAlta = resumen?.itemsAlta ?? 0;
  const itemsAceptados = resumen?.itemsAceptados ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable style={styles.btnRegenerar} onPress={onRegenerar} disabled={isGenerando} hitSlop={8}>
          {isGenerando ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>

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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
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
  btnRegenerar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
