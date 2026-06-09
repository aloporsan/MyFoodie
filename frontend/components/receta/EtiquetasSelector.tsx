import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  etiquetas: string[];
  onChange: (etiquetas: string[]) => void;
}

export function EtiquetasSelector({ etiquetas, onChange }: Props) {
  const [texto, setTexto] = useState('');

  const añadir = () => {
    const tag = texto.trim().toLowerCase();
    if (!tag || etiquetas.includes(tag)) {
      setTexto('');
      return;
    }
    onChange([...etiquetas, tag]);
    setTexto('');
  };

  const eliminar = (tag: string) => {
    onChange(etiquetas.filter((e) => e !== tag));
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="ej. vegetariano"
          placeholderTextColor={colors.grayMid}
          onSubmitEditing={añadir}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.btnAñadir, !texto.trim() && styles.btnDisabled]}
          onPress={añadir}
          disabled={!texto.trim()}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </Pressable>
      </View>

      {etiquetas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {etiquetas.map((tag) => (
              <View key={tag} style={styles.chip}>
                <Text style={styles.chipText}>{tag}</Text>
                <Pressable onPress={() => eliminar(tag)} hitSlop={4}>
                  <Ionicons name="close-circle" size={16} color={colors.primaryDark} />
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
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
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
