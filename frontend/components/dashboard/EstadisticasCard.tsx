import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Estadisticas } from '@/services/dashboardService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  estadisticas: Estadisticas;
}

export function EstadisticasCard({ estadisticas }: Props) {
  const { totalRegistrados, consumidos, caducadosHistorico, categoriaLider, aprovechamiento } =
    estadisticas;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
        <Text style={styles.titulo}>Estadísticas</Text>
      </View>

      {/* Barra de aprovechamiento */}
      <View style={styles.barraWrapper}>
        <View style={styles.barraLabels}>
          <Text style={styles.barraLabel}>Aprovechamiento</Text>
          <Text style={[styles.barraLabel, { color: colors.primary, fontWeight: '700' }]}>
            {aprovechamiento}%
          </Text>
        </View>
        <View style={styles.barraFondo}>
          <View style={[styles.barraRelleno, { width: `${aprovechamiento}%` }]} />
        </View>
      </View>

      {/* Contadores y categoría */}
      <View style={styles.fila}>
        {categoriaLider !== '-' && (
          <View style={styles.chip}>
            <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
            <Text style={styles.chipTexto} numberOfLines={1}>{categoriaLider}</Text>
          </View>
        )}
        <View style={styles.contadores}>
          <View style={styles.contador}>
            <Text style={[styles.contadorNum, { color: colors.grayDark }]}>{totalRegistrados}</Text>
            <Text style={styles.contadorLabel}>Total</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.contador}>
            <Text style={[styles.contadorNum, { color: colors.error }]}>{caducadosHistorico}</Text>
            <Text style={styles.contadorLabel}>Caducados</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.contador}>
            <Text style={[styles.contadorNum, { color: colors.primary }]}>{consumidos}</Text>
            <Text style={styles.contadorLabel}>Consumidos</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  titulo: {
    ...typography.label,
    color: colors.text.primary,
  },
  barraWrapper: {
    gap: spacing.xs,
  },
  barraLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barraLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  barraFondo: {
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5D0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    flexShrink: 1,
  },
  chipTexto: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    flexShrink: 1,
  },
  contadores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contador: {
    alignItems: 'center',
  },
  contadorNum: {
    ...typography.label,
    fontWeight: '700',
  },
  contadorLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  separador: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray,
  },
});
