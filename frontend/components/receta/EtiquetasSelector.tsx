import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ETIQUETAS_SUGERIDAS = [
  'vegetariano', 'vegano', 'sin gluten', 'sin lactosa',
  'rápido', 'económico', 'saludable', 'picante',
  'dulce', 'proteico', 'apto niños', 'mediterráneo',
  'tradicional', 'bajo en calorías', 'alto en proteínas',
];

interface Props {
  etiquetas: string[];
  onChange: (etiquetas: string[]) => void;
}

export function EtiquetasSelector({ etiquetas, onChange }: Props) {
  const [texto, setTexto] = useState('');

  const añadir = (tag: string) => {
    const normalizado = tag.trim().toLowerCase();
    if (!normalizado || etiquetas.includes(normalizado)) {
      setTexto('');
      return;
    }
    onChange([...etiquetas, normalizado]);
    setTexto('');
  };

  const eliminar = (tag: string) => onChange(etiquetas.filter((e) => e !== tag));

  const sugeridosDisponibles = ETIQUETAS_SUGERIDAS.filter((t) => !etiquetas.includes(t));

  return (
    <View style={styles.container}>
      {/* Etiquetas seleccionadas */}
      {etiquetas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {etiquetas.map((tag) => (
              <View key={tag} style={styles.chipActivo}>
                <Text style={styles.chipActivoText}>{tag}</Text>
                <Pressable onPress={() => eliminar(tag)} hitSlop={4}>
                  <Ionicons name="close-circle" size={16} color={colors.primaryDark} />
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Input personalizado */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Añadir etiqueta personalizada..."
          placeholderTextColor={colors.grayMid}
          onSubmitEditing={() => añadir(texto)}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.btnAñadir, !texto.trim() && styles.btnDisabled]}
          onPress={() => añadir(texto)}
          disabled={!texto.trim()}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Sugeridas */}
      {sugeridosDisponibles.length > 0 && (
        <View style={styles.sugeridas}>
          <Text style={styles.sugeridasLabel}>Sugeridas</Text>
          <View style={styles.sugeridasGrid}>
            {sugeridosDisponibles.map((tag) => (
              <Pressable key={tag} style={styles.chipSugerida} onPress={() => añadir(tag)}>
                <Ionicons name="add" size={12} color={colors.primary} />
                <Text style={styles.chipSugeridaText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
  chipActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipActivoText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  btnAñadir: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  sugeridas: { gap: spacing.sm },
  sugeridasLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  sugeridasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipSugerida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  chipSugeridaText: { ...typography.caption, color: colors.text.secondary },
});
