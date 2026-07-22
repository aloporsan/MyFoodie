import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validate = () => {
    setEmailError('');
    setGlobalError('');
    if (!email.trim()) { setEmailError('El email es obligatorio'); return false; }
    if (!EMAIL_REGEX.test(email)) { setEmailError('Email no válido'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
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
          {sent ? (
            /* Estado de éxito */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.successTitle}>Revisa tu email</Text>
              <Text style={styles.successBody}>
                Si el email existe en MyFoodie, habrás recibido un código. Introdúcelo aquí para continuar.
              </Text>

              <View style={styles.tokenForm}>
                <Input
                  label="Código de verificación"
                  placeholder="Pega aquí el código del email"
                  value={token}
                  onChangeText={(t) => { setToken(t); setTokenError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  error={tokenError}
                />
                <Button
                  label="Continuar"
                  loading={isValidating}
                  onPress={async () => {
                    if (!token.trim()) { setTokenError('Introduce el código del email'); return; }
                    setTokenError('');
                    setIsValidating(true);
                    try {
                      await authService.validateToken(token.trim());
                      router.push({ pathname: '/(auth)/reset-password', params: { token: token.trim() } });
                    } catch (e: unknown) {
                      setTokenError(e instanceof Error ? e.message : 'Código no válido');
                    } finally {
                      setIsValidating(false);
                    }
                  }}
                  fullWidth
                />
              </View>

              <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.backLink}>
                <Ionicons name="arrow-back-outline" size={16} color={colors.primary} />
                <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
              </Pressable>
            </View>
          ) : (
            /* Formulario */
            <>
              <Text style={styles.title}>Recuperar contraseña</Text>
              <Text style={styles.subtitle}>
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
              </Text>

              {globalError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={styles.errorBannerText}>{globalError}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="hola@myfoodie.app"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); setGlobalError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={emailError}
                />

                <Button
                  label="Enviar enlace"
                  onPress={handleSubmit}
                  loading={isLoading}
                  fullWidth
                />

                <Pressable onPress={() => router.back()} style={styles.backLink}>
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
  tokenForm: {
    width: '100%',
    gap: spacing.md,
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
  backButton: {
    marginTop: spacing.md,
    width: '100%',
  },
});
