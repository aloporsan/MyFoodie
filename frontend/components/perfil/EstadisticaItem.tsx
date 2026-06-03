import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

interface Props {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  valor: number;
  etiqueta: string;
}

export function EstadisticaItem({ icono, valor, etiqueta }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconoWrapper}>
        <Ionicons name={icono} size={22} color={colors.primary} />
      </View>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    minWidth: 0,
  },
  iconoWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  valor: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  etiqueta: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
