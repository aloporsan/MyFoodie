import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DashboardResumen } from '@/services/dashboardService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  resumen: DashboardResumen;
}

const CONTADORES = [
  { key: 'totalProductos' as const, label: 'Total',         icon: 'basket-outline',    color: colors.primary,     bg: '#E8F5D0', filtro: null },
  { key: 'sinStock'       as const, label: 'Sin stock',     icon: 'close-circle-outline', color: '#616161',       bg: '#EEEEEE', filtro: 'sin_stock' },
  { key: 'caducados'      as const, label: 'Caducados',     icon: 'warning-outline',   color: colors.error,       bg: '#FFEBEE', filtro: 'caducado' },
  { key: 'caduca_pronto'  as const, label: 'Caduca pronto', icon: 'time-outline',      color: '#FF6D00',          bg: '#FBE9E7', filtro: 'caduca_pronto' },
  { key: 'bajoStock'      as const, label: 'Bajo stock',    icon: 'arrow-down-outline', color: '#C79100',         bg: '#FFF8E1', filtro: 'bajoStock' },
  { key: 'caduca_semana'  as const, label: 'Caduca esta semana', icon: 'calendar-outline',  color: colors.secondary,   bg: '#FFF3E0', filtro: 'caduca_semana' },
  { key: 'caduca_mes'     as const, label: 'Caduca este mes',   icon: 'leaf-outline',      color: colors.primaryDark, bg: '#F1F8E9', filtro: 'caduca_mes' },
];

export function ResumenDespensaCard({ resumen }: Props) {
  const router = useRouter();

  const handlePress = (filtro: string | null) => {
    if (filtro) {
      router.push({ pathname: '/despensa/filtrada', params: { filtro } });
    } else {
      router.push('/(tabs)/despensa');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Mi despensa</Text>
      <View style={styles.grid}>
        {CONTADORES.map(({ key, label, icon, color, bg, filtro }) => {
          const esTotal = key === 'totalProductos';
          return (
            <Pressable
              key={key}
              style={[
                styles.celda,
                { backgroundColor: bg },
                esTotal && styles.celdaTotal,
              ]}
              onPress={() => handlePress(filtro)}
            >
              <View style={esTotal ? styles.celdaTopTotal : styles.celdaTop}>
                <Ionicons name={icon as any} size={esTotal ? 22 : 16} color={color} />
                <Text style={[styles.numero, esTotal && styles.numeroTotal, { color }]}>
                  {resumen[key]}
                </Text>
              </View>
              <Text style={[styles.celdaLabel, esTotal && styles.celdaLabelTotal]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
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
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  celda: {
    width: '48%',
    flexGrow: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  celdaTotal: {
    width: '100%',
    flexBasis: '100%',
  },
  celdaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  celdaTopTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numero: {
    ...typography.heading1,
    fontSize: 36,
    lineHeight: 40,
  },
  numeroTotal: {
    fontSize: 44,
    lineHeight: 48,
  },
  celdaLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  celdaLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
});
