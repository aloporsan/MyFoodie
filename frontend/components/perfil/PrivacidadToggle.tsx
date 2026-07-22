import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface Props {
  label: string;
  descripcion: string;
  valor: boolean;
  onChange: (valor: boolean) => void;
}

export function PrivacidadToggle({ label, descripcion, valor, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textos}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        trackColor={{ false: colors.gray, true: colors.primary }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.gray}
        style={Platform.OS === 'android' ? styles.switchAndroid : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  textos: {
    flex: 1,
    marginRight: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  descripcion: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  switchAndroid: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
});
