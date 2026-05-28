import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MyFoodie</Text>
      <Text style={styles.tagline}>Tu despensa inteligente</Text>
      <View style={styles.actions}>
        <Button label="Entrar (placeholder)" fullWidth onPress={signIn} />
        <Button label="Registrarse" variant="secondary" fullWidth onPress={signIn} />
      </View>
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
  },
  logo: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xxxl,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
});
