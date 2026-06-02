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
  {
    key: 'totalProductos' as const,
    label: 'Total',
    icon: 'basket-outline',
    color: colors.primary,
    bg: '#E8F5D0',
    filtro: null,
  },
  {
    key: 'proximosCaducar' as const,
    label: 'Próximos',
    icon: 'time-outline',
    color: colors.secondary,
    bg: '#FFF3E0',
    filtro: 'proximoCaducar',
  },
  {
    key: 'caducados' as const,
    label: 'Caducados',
    icon: 'warning-outline',
    color: colors.error,
    bg: '#FFEBEE',
    filtro: 'caducado',
  },
  {
    key: 'bajoStock' as const,
    label: 'Bajo stock',
    icon: 'arrow-down-outline',
    color: '#C79100',
    bg: '#FFF8E1',
    filtro: 'bajoStock',
  },
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
        {CONTADORES.map(({ key, label, icon, color, bg, filtro }) => (
          <Pressable
            key={key}
            style={[styles.celda, { backgroundColor: bg }]}
            onPress={() => handlePress(filtro)}
          >
            <View style={styles.celdaTop}>
              <Ionicons name={icon as any} size={16} color={color} />
              <Text style={[styles.numero, { color }]}>{resumen[key]}</Text>
            </View>
            <Text style={styles.celdaLabel}>{label}</Text>
          </Pressable>
        ))}
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
  celdaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  numero: {
    ...typography.heading1,
    fontSize: 36,
    lineHeight: 40,
  },
  celdaLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
