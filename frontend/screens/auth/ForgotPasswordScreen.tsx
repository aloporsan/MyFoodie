import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Próximamente disponible</Text>
      <Button
        label="Volver al login"
        variant="secondary"
        onPress={() => router.back()}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.heading1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  button: {
    marginTop: spacing.md,
  },
});
