import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IngredienteReceta } from '@/services/recetaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  ingredientes: IngredienteReceta[];
  onEliminar: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function ListaIngredientes({ ingredientes, onEliminar, isLoading = false }: Props) {
  if (ingredientes.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioText}>Sin ingredientes todavía</Text>
      </View>
    );
  }

  return (
    <View style={styles.lista}>
      {ingredientes.map((ing) => (
        <View key={ing.id} style={styles.item}>
          <View style={styles.info}>
            <Text style={styles.nombre}>{ing.nombre}</Text>
            <Text style={styles.detalle}>
              {ing.cantidad} {ing.unidad}
              {ing.observacion ? ` · ${ing.observacion}` : ''}
            </Text>
          </View>
          <Pressable
            style={styles.btnEliminar}
            onPress={() => onEliminar(ing.id)}
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
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  info: { flex: 1, gap: 2 },
  nombre: { ...typography.label, color: colors.text.primary },
  detalle: { ...typography.caption, color: colors.text.secondary },
  btnEliminar: { padding: spacing.xs },
  vacio: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
  },
  vacioText: { ...typography.body, color: colors.text.secondary },
});
