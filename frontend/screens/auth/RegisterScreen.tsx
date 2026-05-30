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
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { height } = useWindowDimensions();

  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState({
    nombre: '',
    nombreUsuario: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateField = (field: keyof typeof errors, value: string) => {
    let msg = '';
    switch (field) {
      case 'nombre':
        if (!value.trim()) msg = 'El nombre es obligatorio';
        break;
      case 'nombreUsuario':
        if (!value.trim()) msg = 'El nombre de usuario es obligatorio';
        else if (!USERNAME_REGEX.test(value)) msg = 'Solo letras, números y _ (3-30 caracteres)';
        break;
      case 'email':
        if (!value.trim()) msg = 'El email es obligatorio';
        else if (!EMAIL_REGEX.test(value)) msg = 'Email no válido';
        break;
      case 'password':
        if (!value) msg = 'La contraseña es obligatoria';
        else if (value.length < 8) msg = 'Mínimo 8 caracteres';
        break;
      case 'confirmPassword':
        if (!value) msg = 'Confirma tu contraseña';
        else if (value !== password) msg = 'Las contraseñas no coinciden';
        break;
    }
    setErrors(prev => ({ ...prev, [field]: msg }));
    return msg === '';
  };

  const validateAll = () => {
    const fields: (keyof typeof errors)[] = ['nombre', 'nombreUsuario', 'email', 'password', 'confirmPassword'];
    const values = { nombre, nombreUsuario, email, password, confirmPassword };
    return fields.every(f => validateField(f, values[f]));
  };

  const handleRegister = async () => {
    if (!validateAll()) return;
    clearError();
    try {
      await register({ nombre, nombreUsuario, email, password });
    } catch {
      // error state is set in authStore
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <View style={[styles.header, { minHeight: height * 0.22 }]}>
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

        {/* Formulario */}
        <View style={styles.card}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete a la comunidad MyFoodie</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Nombre"
              placeholder="Tu nombre"
              value={nombre}
              onChangeText={(t) => { setNombre(t); validateField('nombre', t); }}
              autoCapitalize="words"
              error={errors.nombre}
            />

            <Input
              label="Nombre de usuario"
              placeholder="ej. maria_foodie"
              value={nombreUsuario}
              onChangeText={(t) => { setNombreUsuario(t); validateField('nombreUsuario', t); }}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.nombreUsuario}
            />

            <Input
              label="Email"
              placeholder="hola@myfoodie.app"
              value={email}
              onChangeText={(t) => { setEmail(t); validateField('email', t); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={(t) => { setPassword(t); validateField('password', t); }}
              secureTextEntry={!showPassword}
              error={errors.password}
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
              onChangeText={(t) => { setConfirmPassword(t); validateField('confirmPassword', t); }}
              secureTextEntry={!showConfirm}
              error={errors.confirmPassword}
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
              label="Crear cuenta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </Pressable>
            </View>
          </View>
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
    gap: 2,
  },
  logoIcon: {
    width: 80,
    height: 80,
  },
  logoText: {
    width: 150,
    height: 42,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  loginLink: {
    ...typography.label,
    color: colors.secondary,
  },
});
