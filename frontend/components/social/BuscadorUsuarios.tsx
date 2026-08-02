import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';

interface Props {
  value: string;
  onBuscar: (texto: string) => void;
  onLimpiar: () => void;
  placeholder?: string;
}

export function BuscadorUsuarios({
  value,
  onBuscar,
  onLimpiar,
  placeholder = 'Buscar usuarios...',
}: Props) {
  const [texto, setTexto] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTexto(value);
  }, [value]);

  const handleChange = (t: string) => {
    setTexto(t);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onBuscar(t), 300);
  };

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTexto('');
    onLimpiar();
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={colors.grayDark} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.grayMid}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        textAlignVertical="center"
        testID="input-buscar-usuarios"
      />
      {texto.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8} testID="btn-limpiar">
          <Ionicons name="close-circle" size={20} color={colors.grayMid} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
  },
  icon: {
    flexShrink: 0,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    height: '100%',
    padding: 0,
  },
});
