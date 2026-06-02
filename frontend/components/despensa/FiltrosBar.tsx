import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EstadoProducto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type FiltroId = 'todos' | EstadoProducto;

interface Chip {
  id: FiltroId;
  label: string;
  color?: string;
}

const ESTADO_CHIPS: Record<EstadoProducto, Chip> = {
  caducado:       { id: 'caducado',       label: 'Caducados',  color: colors.error },
  proximoCaducar: { id: 'proximoCaducar', label: 'Próximos',   color: colors.secondary },
  bajoStock:      { id: 'bajoStock',      label: 'Bajo stock', color: '#F5D800' },
  normal:         { id: 'normal',         label: 'En stock',   color: colors.primary },
};

interface Props {
  filtroActivo: FiltroId | string;
  estadosPresentes: EstadoProducto[];
  onFiltroChange: (filtro: FiltroId) => void;
}

export function FiltrosBar({ filtroActivo, estadosPresentes, onFiltroChange }: Props) {
  const chips: Chip[] = [
    { id: 'todos', label: 'Todos' },
    ...estadosPresentes
      .filter((e) => e !== 'normal')
      .map((e) => ESTADO_CHIPS[e]),
  ];

  if (chips.length <= 1) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {chips.map((chip) => {
          const activo = filtroActivo === chip.id;
          const accentColor = chip.color ?? colors.primary;
          return (
            <Pressable
              key={chip.id}
              style={[
                styles.chip,
                activo && { backgroundColor: accentColor + '22', borderColor: accentColor },
              ]}
              onPress={() => onFiltroChange(chip.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  activo && { color: accentColor, fontWeight: '700' },
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
