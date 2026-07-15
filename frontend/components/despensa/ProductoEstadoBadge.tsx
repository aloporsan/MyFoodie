import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EstadoProducto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const CONFIG: Record<EstadoProducto, { bg: string; text: string; label: string }> = {
  caducado:      { bg: colors.error,     text: colors.white,       label: 'Caducado' },
  caduca_hoy:    { bg: '#FF6D00',        text: colors.white,       label: 'Caduca hoy' },
  caduca_pronto: { bg: colors.secondary, text: colors.white,       label: 'Caduca pronto' },
  caduca_semana: { bg: '#FDD835',        text: '#5C3400',          label: 'Esta semana' },
  caduca_mes:    { bg: '#DCE775',        text: '#33691E',          label: 'Este mes' },
  bajoStock:     { bg: '#F5D800',        text: '#5C4200',          label: 'Bajo stock' },
  normal:        { bg: '#E8F5D0',        text: colors.primaryDark, label: 'En stock' },
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
