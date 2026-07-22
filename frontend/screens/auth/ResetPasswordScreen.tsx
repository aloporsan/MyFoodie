import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Input } from '@/components/ui';
import { authService } from '@/services/authService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { height } = useWindowDimensions();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [done, setDone] = useState(false);

  const validate = () => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');
    setGlobalError('');
    if (!password) { setPasswordError('La contraseña es obligatoria'); valid = false; }
    else if (password.length < 8) { setPasswordError('Mínimo 8 caracteres'); valid = false; }
    if (!confirmPassword) { setConfirmError('Confirma tu contraseña'); valid = false; }
    else if (password !== confirmPassword) { setConfirmError('Las contraseñas no coinciden'); valid = false; }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.resetPassword(token!, password);
      setDone(true);
    } catch (e: unknown) {
      setGlobalError(e instanceof Error ? e.message : 'Algo ha salido mal. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Cabecera verde */}
      <View style={[styles.header, { height: height * 0.32 }]}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('@/assets/images/logo-myfoodie.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Image
            source={require('@/assets/images/logo-texto.png')}
            style={styles.logoText}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {done ? (
            /* Estado de éxito */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.successTitle}>¡Contraseña cambiada!</Text>
              <Text style={styles.successBody}>
                Tu contraseña se ha actualizado correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </Text>
              <Button
                label="Iniciar sesión"
                onPress={() => router.replace('/(auth)/login')}
                fullWidth
                style={styles.loginButton}
              />
            </View>
          ) : (
            /* Formulario */
            <>
              <Text style={styles.title}>Restablecer contraseña</Text>
              <Text style={styles.subtitle}>
                Introduce el código que recibiste en tu email y elige una nueva contraseña.
              </Text>

              {globalError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={styles.errorBannerText}>{globalError}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <Input
                  label="Nueva contraseña"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); setGlobalError(''); }}
                  secureTextEntry={!showPassword}
                  error={passwordError}
                  rightElement={
                    <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.grayDark}
                      />
                    </Pressable>
                  }
                />

                <Input
                  label="Confirmar contraseña"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setConfirmError(''); }}
                  secureTextEntry={!showConfirm}
                  error={confirmError}
                  rightElement={
                    <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.grayDark}
                      />
                    </Pressable>
                  }
                />

                <Button
                  label="Cambiar contraseña"
                  onPress={handleSubmit}
                  loading={isLoading}
                  fullWidth
                />

                <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.backLink}>
                  <Ionicons name="arrow-back-outline" size={16} color={colors.primary} />
                  <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  formScroll: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  logoWrapper: {
    backgroundColor: colors.white,
    borderRadius: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 1,
  },
  logoIcon: {
    width: 64,
    height: 64,
  },
  logoText: {
    width: 120,
    height: 34,
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.heading1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    color: colors.error,
    flex: 1,
  },
  form: {
    gap: spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  backLinkText: {
    ...typography.label,
    color: colors.primary,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...typography.heading1,
    color: colors.text.primary,
  },
  successBody: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    marginTop: spacing.md,
    width: '100%',
  },
});
