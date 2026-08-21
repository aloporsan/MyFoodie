import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface BadgeNotificacionesProps {
  contador: number;
}

export function BadgeNotificaciones({ contador }: BadgeNotificacionesProps) {
  const escala = useRef(new Animated.Value(0)).current;
  const visible = contador > 0;

  useEffect(() => {
    Animated.spring(escala, {
      toValue: visible ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [visible, escala]);

  const texto = contador > 99 ? '99+' : String(contador);

  return (
    <Animated.View
      style={[styles.badge, { transform: [{ scale: escala }], opacity: escala }]}
      pointerEvents="none"
      testID="badge-notificaciones"
    >
      <Text style={styles.texto} numberOfLines={1}>
        {texto}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  texto: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
    fontWeight: '700',
  },
});
