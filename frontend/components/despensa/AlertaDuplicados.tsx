import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  cantidad: number;
  onRevisar: () => void;
}

const COLOR_FONDO = '#FFF3E0';

export function AlertaDuplicados({ cantidad, onRevisar }: Props) {
  const [cerrado, setCerrado] = useState(false);

  if (cerrado || cantidad <= 0) {
    return null;
  }

  const plural = cantidad === 1 ? '' : 's';

  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle-outline" size={20} color={colors.secondary} />
      <Text style={styles.texto}>
        Hemos detectado {cantidad} producto{plural} que podría{plural} ser el mismo. ¿Quieres
        revisarlos?
      </Text>
      <Pressable style={styles.btnRevisar} onPress={onRevisar} hitSlop={8}>
        <Text style={styles.btnRevisarTexto}>Revisar</Text>
      </Pressable>
      <Pressable onPress={() => setCerrado(true)} hitSlop={8} testID="alerta-duplicados-cerrar">
        <Ionicons name="close" size={18} color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: COLOR_FONDO,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  texto: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  btnRevisar: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  btnRevisarTexto: {
    ...typography.label,
    color: colors.secondary,
    fontWeight: '700',
  },
});
