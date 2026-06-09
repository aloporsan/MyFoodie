import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PasoReceta } from '@/services/recetaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  pasos: PasoReceta[];
  onEliminar: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function ListaPasos({ pasos, onEliminar, isLoading = false }: Props) {
  if (pasos.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioText}>Sin pasos todavía</Text>
      </View>
    );
  }

  const ordenados = [...pasos].sort((a, b) => a.orden - b.orden);

  return (
    <View style={styles.lista}>
      {ordenados.map((paso) => (
        <View key={paso.id} style={styles.item}>
          <View style={styles.numero}>
            <Text style={styles.numeroText}>{paso.orden}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.descripcion}>{paso.descripcion}</Text>
          </View>
          <Pressable
            style={styles.btnEliminar}
            onPress={() => onEliminar(paso.id)}
            disabled={isLoading}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
    gap: spacing.md,
  },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  numeroText: {
    ...typography.label,
    color: colors.white,
    fontSize: 12,
  },
  info: { flex: 1 },
  descripcion: { ...typography.body, color: colors.text.primary },
  btnEliminar: { padding: spacing.xs, marginTop: 2 },
  vacio: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
  },
  vacioText: { ...typography.body, color: colors.text.secondary },
});
