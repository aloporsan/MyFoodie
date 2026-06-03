import { Pressable, StyleSheet, Text } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

interface Props {
  label: string;
  activo: boolean;
  onPress: () => void;
}

export function PreferenciaChip({ label, activo, onPress }: Props) {
  return (
    <Pressable
      style={[styles.chip, activo ? styles.chipActivo : styles.chipInactivo]}
      onPress={onPress}
      hitSlop={4}
    >
      <Text style={[styles.label, activo ? styles.labelActivo : styles.labelInactivo]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActivo: {
    backgroundColor: colors.primary,
  },
  chipInactivo: {
    backgroundColor: colors.gray,
  },
  label: {
    ...typography.label,
  },
  labelActivo: {
    color: colors.white,
  },
  labelInactivo: {
    color: colors.grayDark,
  },
});
