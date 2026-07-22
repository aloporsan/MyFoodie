import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function DashboardEmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="basket-outline" size={72} color={colors.primary} />
      </View>
      <Text style={styles.titulo}>Tu despensa está vacía</Text>
      <Text style={styles.subtitulo}>
        Todavía no tienes productos en tu despensa.{'\n'}
        ¡Añade el primero para empezar!
      </Text>
      <Pressable style={styles.btn} onPress={() => router.push('/despensa/form')}>
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.btnTexto}>Añadir primer producto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitulo: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  btnTexto: {
    ...typography.button,
    color: colors.white,
  },
});
