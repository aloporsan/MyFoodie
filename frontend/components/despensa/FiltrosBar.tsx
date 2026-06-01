import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { EstadoProducto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type FiltroId = 'todos' | EstadoProducto | string;

interface Chip {
  id: FiltroId;
  label: string;
}

const CHIPS_BASE: Chip[] = [
  { id: 'todos',          label: 'Todos' },
  { id: 'caducado',       label: 'Caducados' },
  { id: 'proximoCaducar', label: 'Próximos' },
  { id: 'bajoStock',      label: 'Bajo stock' },
];

interface Props {
  filtroActivo: FiltroId;
  categorias?: string[];
  onFiltroChange: (filtro: FiltroId) => void;
}

export function FiltrosBar({ filtroActivo, categorias = [], onFiltroChange }: Props) {
  const chips: Chip[] = [
    ...CHIPS_BASE,
    ...categorias.map((c) => ({ id: c, label: c })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {chips.map((chip) => {
        const activo = filtroActivo === chip.id;
        return (
          <Pressable
            key={chip.id}
            style={[styles.chip, activo && styles.chipActivo]}
            onPress={() => onFiltroChange(chip.id)}
          >
            <Text style={[styles.chipText, activo && styles.chipTextoActivo]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActivo: {
    backgroundColor: '#E8F5D0',
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  chipTextoActivo: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
