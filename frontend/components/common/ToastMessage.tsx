import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { borderRadius } from '@/theme/borderRadius';

export type ToastTipo = 'success' | 'error' | 'info' | 'warning';

interface ToastMessageProps {
  tipo: ToastTipo;
  mensaje: string;
  visible: boolean;
  onDismiss?: () => void;
}

const COLOR_MAP: Record<ToastTipo, string> = {
  success: colors.primary,
  error: colors.error,
  info: '#1E88E5',
  warning: colors.secondary,
};

export function ToastMessage({ tipo, mensaje, visible, onDismiss }: ToastMessageProps) {
  const [localVisible, setLocalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && mensaje) {
      setLocalVisible(true);

      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setLocalVisible(false);
          onDismiss?.();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setLocalVisible(false);
    }
  }, [visible, mensaje]);

  if (!localVisible || !mensaje) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: COLOR_MAP[tipo], transform: [{ translateY }], opacity },
      ]}
      testID="toast-container"
    >
      <View style={styles.inner}>
        <Text style={styles.texto} numberOfLines={2} testID="toast-mensaje">
          {mensaje}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texto: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    fontWeight: '600',
  },
});
