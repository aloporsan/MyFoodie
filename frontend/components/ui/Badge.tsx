import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type BadgeVariant = 'primary' | 'secondary' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const containerStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    neutral: styles.neutral,
  }[variant];

  const textStyle = {
    primary: styles.labelPrimary,
    secondary: styles.labelSecondary,
    neutral: styles.labelNeutral,
  }[variant];

  return (
    <View style={[styles.base, containerStyle, style]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Variants
  primary: {
    backgroundColor: '#EBF6D6',
  },
  secondary: {
    backgroundColor: '#FEF3E0',
  },
  neutral: {
    backgroundColor: colors.grayLight,
  },

  // Labels
  label: {
    ...typography.caption,
    fontFamily: 'Poppins_500Medium',
  },
  labelPrimary: {
    color: colors.primaryDark,
  },
  labelSecondary: {
    color: colors.secondary,
  },
  labelNeutral: {
    color: colors.grayDark,
  },
});
