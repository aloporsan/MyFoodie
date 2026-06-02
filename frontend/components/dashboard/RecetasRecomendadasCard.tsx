import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function RecetasRecomendadasCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Ionicons name="restaurant-outline" size={28} color={colors.grayDark} />
        </View>
        <View style={styles.texto}>
          <Text style={styles.titulo}>Recetas recomendadas</Text>
          <Text style={styles.descripcion}>
            Recetas personalizadas según lo que tienes en casa
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>Pronto</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texto: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    ...typography.label,
    color: colors.text.primary,
  },
  descripcion: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
});
