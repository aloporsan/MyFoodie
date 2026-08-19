import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  equivalencia: string;
}

export function AvisoConversionUnidad({ equivalencia }: Props) {
  return (
    <View style={styles.container} testID="aviso-conversion-unidad">
      <Ionicons name="information-circle" size={16} color={colors.secondary} />
      <Text style={styles.texto}>
        Esta unidad se convertirá automáticamente a {equivalencia} para mantener la trazabilidad del inventario
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  texto: {
    ...typography.caption,
    color: colors.secondary,
    flex: 1,
  },
});
