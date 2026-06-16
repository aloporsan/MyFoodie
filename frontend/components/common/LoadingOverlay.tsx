import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface LoadingOverlayProps {
  visible: boolean;
  mensaje?: string;
}

export function LoadingOverlay({ visible, mensaje }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} testID="loading-overlay">
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.primary} testID="loading-spinner" />
        {mensaje ? (
          <Text style={styles.texto} testID="loading-mensaje">
            {mensaje}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  box: {
    alignItems: 'center',
    gap: spacing.md,
  },
  texto: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
