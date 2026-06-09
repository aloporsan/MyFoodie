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
  onReordenar?: (ordenIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function ListaPasos({ pasos, onEliminar, onReordenar, isLoading = false }: Props) {
  if (pasos.length === 0) {
    return (
      <View style={styles.vacio}>
        <Ionicons name="list-outline" size={32} color={colors.grayMid} />
        <Text style={styles.vacioText}>Sin pasos todavía</Text>
      </View>
    );
  }

  const ordenados = [...pasos].sort((a, b) => a.orden - b.orden);

  const mover = (index: number, direccion: 'arriba' | 'abajo') => {
    if (!onReordenar) return;
    const nuevos = [...ordenados];
    const swapIndex = direccion === 'arriba' ? index - 1 : index + 1;
    [nuevos[index], nuevos[swapIndex]] = [nuevos[swapIndex], nuevos[index]];
    onReordenar(nuevos.map((p) => p.id));
  };

  return (
    <View style={styles.lista}>
      {ordenados.map((paso, index) => (
        <View key={paso.id} style={styles.item}>
          <View style={styles.numero}>
            <Text style={styles.numeroText}>{paso.orden}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.descripcion}>{paso.descripcion}</Text>
          </View>

          <View style={styles.acciones}>
            {onReordenar && (
              <View style={styles.reorderBtns}>
                <Pressable
                  onPress={() => mover(index, 'arriba')}
                  disabled={index === 0 || isLoading}
                  hitSlop={4}
                  style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-up" size={16} color={index === 0 ? colors.grayMid : colors.grayDark} />
                </Pressable>
                <Pressable
                  onPress={() => mover(index, 'abajo')}
                  disabled={index === ordenados.length - 1 || isLoading}
                  hitSlop={4}
                  style={[styles.reorderBtn, index === ordenados.length - 1 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-down" size={16} color={index === ordenados.length - 1 ? colors.grayMid : colors.grayDark} />
                </Pressable>
              </View>
            )}
            <Pressable
              style={styles.btnEliminar}
              onPress={() => onEliminar(paso.id)}
              disabled={isLoading}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </Pressable>
          </View>
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
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray,
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
  numeroText: { ...typography.label, color: colors.white, fontSize: 12 },
  info: { flex: 1 },
  descripcion: { ...typography.body, color: colors.text.primary, lineHeight: 20 },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reorderBtns: { gap: 2 },
  reorderBtn: { padding: 2 },
  reorderBtnDisabled: { opacity: 0.3 },
  btnEliminar: { padding: spacing.xs },
  vacio: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
  },
  vacioText: { ...typography.body, color: colors.text.secondary },
});
