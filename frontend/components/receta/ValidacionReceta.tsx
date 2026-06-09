import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  mensaje: string | null;
}

export function ValidacionReceta({ mensaje }: Props) {
  if (!mensaje) return null;

  const errores = mensaje.split(', ').filter(Boolean);

  return (
    <View style={styles.banner}>
      <View style={styles.cabecera}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
        <Text style={styles.titulo}>La receta no está lista para publicar</Text>
      </View>
      {errores.map((err, i) => (
        <View key={i} style={styles.fila}>
          <Text style={styles.bullet}>·</Text>
          <Text style={styles.texto}>{err}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF0F0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: spacing.xs,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  titulo: {
    ...typography.label,
    color: colors.error,
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
    color: colors.error,
  },
  texto: {
    ...typography.body,
    color: colors.error,
    flex: 1,
  },
});
