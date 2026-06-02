import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertaCaducidad } from '@/services/dashboardService';
import { ProductoEstadoBadge } from '@/components/despensa/ProductoEstadoBadge';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  alertas: AlertaCaducidad[];
}

function diasLabel(dias: number, estado: string): string {
  if (estado === 'caducado') return 'Caducado';
  if (dias === 0) return 'Caduca hoy';
  if (dias === 1) return 'Caduca mañana';
  return `${dias}d`;
}

export function AlertaCaducidadCard({ alertas }: Props) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
        <Text style={styles.titulo}>Alertas de caducidad</Text>
      </View>

      {alertas.length === 0 ? (
        <View style={styles.okRow}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.okText}>¡Todo en orden! No hay alertas</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lista}
        >
          {alertas.map((alerta) => (
            <Pressable
              key={alerta.id}
              style={[
                styles.item,
                alerta.estado === 'caducado' ? styles.itemCaducado : styles.itemProximo,
              ]}
              onPress={() => router.push(`/despensa/${alerta.id}`)}
            >
              <Text style={styles.itemNombre} numberOfLines={1}>{alerta.nombre}</Text>
              <Text style={styles.itemDias}>{diasLabel(alerta.diasParaCaducar, alerta.estado)}</Text>
              <ProductoEstadoBadge estado={alerta.estado} size="sm" />
            </Pressable>
          ))}
        </ScrollView>
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
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  okText: {
    ...typography.body,
    color: colors.primary,
  },
  lista: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  item: {
    width: 120,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemCaducado: {
    backgroundColor: '#FFEBEE',
  },
  itemProximo: {
    backgroundColor: '#FFF3E0',
  },
  itemNombre: {
    ...typography.label,
    color: colors.text.primary,
    fontSize: 13,
  },
  itemDias: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
