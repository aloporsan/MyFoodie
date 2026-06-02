import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Producto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { getCategoriaConfig } from '@/utils/categoriaConfig';
import { ProductoEstadoBadge } from './ProductoEstadoBadge';

interface Props {
  producto: Producto;
  onEditar: () => void;
  onEliminar: () => void;
  onIncrementar: () => void;
  onDecrementar: () => void;
  onPress?: () => void;
}

export function ProductoCard({
  producto, onEditar, onEliminar, onIncrementar, onDecrementar, onPress,
}: Props) {
  const tieneDuplicados = producto.posiblesDuplicados && producto.posiblesDuplicados.length > 0;
  const cat = getCategoriaConfig(producto.categoria);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {tieneDuplicados && (
        <View style={styles.duplicadosBanner}>
          <Ionicons name="warning-outline" size={12} color={colors.secondary} />
          <Text style={styles.duplicadosText}>Posible duplicado en despensa</Text>
        </View>
      )}

      <View style={styles.row}>
        {/* Icono de categoría */}
        <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
          <Ionicons name={cat.icon as any} size={22} color={cat.fg} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{producto.nombre}</Text>
          <Text style={styles.detalle}>
            {producto.cantidad} {producto.unidad}
            {producto.marca ? ` · ${producto.marca}` : ''}
          </Text>
          {producto.categoria && (
            <Text style={[styles.categoria, { color: cat.fg }]}>{producto.categoria}</Text>
          )}
        </View>

        <ProductoEstadoBadge estado={producto.estado} size="sm" />
      </View>

      <View style={styles.actions}>
        <View style={styles.cantidadControls}>
          <Pressable style={styles.controlBtn} onPress={onDecrementar} hitSlop={8}>
            <Ionicons name="remove" size={18} color={colors.primary} />
          </Pressable>
          <Text style={styles.cantidad}>{producto.cantidad}</Text>
          <Pressable style={styles.controlBtn} onPress={onIncrementar} hitSlop={8}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.iconBtns}>
          <Pressable style={styles.iconBtn} onPress={onEditar} hitSlop={8}>
            <Ionicons name="pencil" size={22} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onEliminar} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  duplicadosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  duplicadosText: {
    ...typography.caption,
    color: colors.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    ...typography.label,
    color: colors.text.primary,
  },
  detalle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  categoria: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  cantidadControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlBtn: {
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  cantidad: {
    ...typography.label,
    color: colors.text.primary,
    minWidth: 28,
    textAlign: 'center',
  },
  iconBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    padding: spacing.xs,
  },
});
