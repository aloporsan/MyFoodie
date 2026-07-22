import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

interface Props {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  valor: number;
  etiqueta: string;
  color?: string;
}

export function EstadisticaItem({ icono, valor, etiqueta, color = colors.primary }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconoWrapper, { backgroundColor: color + '20' }]}>
        <Ionicons name={icono} size={24} color={color} />
      </View>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.etiqueta} numberOfLines={2}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    minWidth: 0,
    gap: spacing.sm,
  },
  iconoWrapper: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    ...typography.heading1,
    color: colors.text.primary,
    lineHeight: 32,
  },
  etiqueta: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
