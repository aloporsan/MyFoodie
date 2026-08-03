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
  onGenerarLista: () => void;
}

export function ResumenCarritoHeader({ resumen, isGenerando = false, onRegenerar, onGenerarLista }: Props) {
  const totalItems = resumen?.totalItems ?? 0;
  const itemsAlta = resumen?.itemsAlta ?? 0;
  const itemsAceptados = resumen?.itemsAceptados ?? 0;
  const puedeGenerarLista = itemsAceptados > 0;

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

        <Pressable style={styles.btnRegenerar} onPress={onRegenerar} disabled={isGenerando} hitSlop={8}>
          {isGenerando ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <Pressable
        style={[styles.btnGenerarLista, !puedeGenerarLista && styles.btnDisabled]}
        onPress={onGenerarLista}
        disabled={!puedeGenerarLista}
      >
        <Ionicons name="list-outline" size={18} color={colors.white} />
        <Text style={styles.btnGenerarListaText}>Generar lista de compra</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGenerarLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
  },
  btnGenerarListaText: {
    ...typography.button,
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
