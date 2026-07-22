import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface ErrorScreenProps {
  titulo: string;
  descripcion: string;
  onReintentar?: () => void;
  onVolver?: () => void;
}

export function ErrorScreen({ titulo, descripcion, onReintentar, onVolver }: ErrorScreenProps) {
  return (
    <View style={styles.container} testID="error-screen">
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline-outline" size={80} color={colors.grayMid} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>
      <View style={styles.botones}>
        {onReintentar && (
          <Pressable
            style={styles.botonPrimario}
            onPress={onReintentar}
            testID="btn-reintentar"
          >
            <Text style={styles.botonPrimarioText}>Reintentar</Text>
          </Pressable>
        )}
        {onVolver && (
          <Pressable
            style={styles.botonSecundario}
            onPress={onVolver}
            testID="btn-volver"
          >
            <Text style={styles.botonSecundarioText}>Volver</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
    gap: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  descripcion: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  botones: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  botonPrimario: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  botonPrimarioText: {
    ...typography.button,
    color: colors.white,
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    minHeight: 44,
    justifyContent: 'center',
  },
  botonSecundarioText: {
    ...typography.button,
    color: colors.text.secondary,
  },
});
