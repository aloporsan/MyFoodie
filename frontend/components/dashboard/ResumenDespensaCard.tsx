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
    color: colors.grayDark,
    bg: colors.grayLight,
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
  const todoVacio = resumen.totalProductos === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Mi despensa</Text>

      {todoVacio ? (
        <Text style={styles.vacio}>Tu despensa está vacía</Text>
      ) : (
        <View style={styles.grid}>
          {CONTADORES.map(({ key, label, icon, color, bg, filtro }) => (
            <Pressable
              key={key}
              style={[styles.celda, { backgroundColor: bg }]}
              onPress={() =>
                router.push(filtro
                  ? { pathname: '/(tabs)/despensa', params: { filtroInicial: filtro } }
                  : '/(tabs)/despensa')
              }
            >
              <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon as any} size={20} color={color} />
              </View>
              <Text style={[styles.numero, { color }]}>{resumen[key]}</Text>
              <Text style={styles.celdaLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
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
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vacio: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  celda: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    ...typography.heading1,
    fontSize: 28,
    lineHeight: 32,
  },
  celdaLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
