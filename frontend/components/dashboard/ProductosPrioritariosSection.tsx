import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductoEstadoBadge } from '@/components/despensa/ProductoEstadoBadge';
import { ProductoPrioritario } from '@/services/dashboardService';
import { EstadoProducto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  prioritarios: ProductoPrioritario[];
}

export function ProductosPrioritariosSection({ prioritarios }: Props) {
  const router = useRouter();

  if (prioritarios.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={18} color={colors.secondary} />
        <Text style={styles.titulo}>Necesitan atención</Text>
      </View>

      {prioritarios.map((p, index) => (
        <Pressable
          key={p.id}
          style={[styles.fila, index < prioritarios.length - 1 && styles.filaBorde]}
          onPress={() => router.push(`/despensa/${p.id}`)}
        >
          <View style={styles.info}>
            <Text style={styles.nombre} numberOfLines={1}>{p.nombre}</Text>
            <Text style={styles.cantidad}>{p.cantidad} {p.unidad}</Text>
          </View>
          <ProductoEstadoBadge estado={p.estado as EstadoProducto} size="sm" />
        </Pressable>
      ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  titulo: {
    ...typography.label,
    color: colors.text.primary,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  filaBorde: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    ...typography.label,
    color: colors.text.primary,
  },
  cantidad: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
