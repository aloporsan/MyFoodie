import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EstadoProducto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const CONFIG: Record<EstadoProducto, { bg: string; text: string; label: string }> = {
  caducado:       { bg: colors.error,         text: colors.white,        label: 'Caducado' },
  proximoCaducar: { bg: colors.secondary,      text: colors.white,        label: 'Caduca pronto' },
  bajoStock:      { bg: colors.secondaryLight, text: colors.text.primary, label: 'Bajo stock' },
  normal:         { bg: '#E8F5D0',             text: colors.primaryDark,  label: 'En stock' },
};

interface Props {
  estado: EstadoProducto;
  size?: 'sm' | 'md';
}

export function ProductoEstadoBadge({ estado, size = 'md' }: Props) {
  const { bg, text, label } = CONFIG[estado];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.label, { color: text }, size === 'sm' && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
  },
});
