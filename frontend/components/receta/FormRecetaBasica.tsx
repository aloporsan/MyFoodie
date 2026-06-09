import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const DIFICULTADES = ['Fácil', 'Media', 'Difícil'];
const CATEGORIAS = [
  'Desayuno', 'Almuerzo', 'Cena', 'Entrante',
  'Postre', 'Snack', 'Bebida', 'Otro',
];

interface Props {
  titulo: string;
  descripcion: string;
  tiempoEstimado: string;
  dificultad: string;
  categoria: string;
  onChange: (campo: string, valor: string) => void;
  errores?: Record<string, string>;
}

export function FormRecetaBasica({
  titulo, descripcion, tiempoEstimado, dificultad, categoria, onChange, errores = {},
}: Props) {
  return (
    <View style={styles.container}>
      <Campo label="Título *" error={errores.titulo}>
        <TextInput
          style={[styles.input, errores.titulo && styles.inputError]}
          value={titulo}
          onChangeText={(v) => onChange('titulo', v)}
          placeholder="ej. Tortilla española"
          placeholderTextColor={colors.grayMid}
        />
      </Campo>

      <Campo label="Descripción *" error={errores.descripcion}>
        <TextInput
          style={[styles.input, styles.textarea, errores.descripcion && styles.inputError]}
          value={descripcion}
          onChangeText={(v) => onChange('descripcion', v)}
          placeholder="Describe brevemente tu receta..."
          placeholderTextColor={colors.grayMid}
          multiline
          numberOfLines={3}
        />
      </Campo>

      <Campo label="Tiempo estimado (min) *" error={errores.tiempoEstimado}>
        <TextInput
          style={[styles.input, errores.tiempoEstimado && styles.inputError]}
          value={tiempoEstimado}
          onChangeText={(v) => onChange('tiempoEstimado', v)}
          placeholder="ej. 30"
          placeholderTextColor={colors.grayMid}
          keyboardType="number-pad"
        />
      </Campo>

      <Campo label="Dificultad *" error={errores.dificultad}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <View style={styles.chipsRow}>
            {DIFICULTADES.map((op) => (
              <Chip
                key={op}
                label={op}
                activo={dificultad === op}
                onPress={() => onChange('dificultad', op)}
              />
            ))}
          </View>
        </ScrollView>
      </Campo>

      <Campo label="Categoría *" error={errores.categoria}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <View style={styles.chipsRow}>
            {CATEGORIAS.map((op) => (
              <Chip
                key={op}
                label={op}
                activo={categoria === op}
                onPress={() => onChange('categoria', op)}
              />
            ))}
          </View>
        </ScrollView>
      </Campo>
    </View>
  );
}

function Campo({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <View style={campoStyles.container}>
      <Text style={campoStyles.label}>{label}</Text>
      {children}
      {error ? <Text style={campoStyles.error}>{error}</Text> : null}
    </View>
  );
}

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, activo && styles.chipActivo]}
      onPress={onPress}
      hitSlop={4}
    >
      <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.error },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  chipsScroll: { marginTop: spacing.xs },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActivo: { backgroundColor: '#E8F5D0', borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },
  chipTextActivo: { color: colors.primaryDark, fontWeight: '700' },
});

const campoStyles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  error: { ...typography.caption, color: colors.error },
});
