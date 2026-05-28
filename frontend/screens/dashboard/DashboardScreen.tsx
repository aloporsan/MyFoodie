import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Mi despensa y resumen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.default,
  },
  title: {
    ...typography.heading1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 8,
  },
});
