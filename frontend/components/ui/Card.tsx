import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing, type SpacingKey } from '@/theme/spacing';

interface CardProps {
  children: React.ReactNode;
  padding?: SpacingKey;
  style?: ViewStyle;
}

export function Card({ children, padding = 'lg', style }: CardProps) {
  return (
    <View style={[styles.card, { padding: spacing[padding] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
});
