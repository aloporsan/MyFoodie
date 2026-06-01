import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  value: string;
  onSearch: (texto: string) => void;
  placeholder?: string;
}

export function BuscadorDespensa({ value, onSearch, placeholder = 'Buscar producto...' }: Props) {
  const [texto, setTexto] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTexto(value);
  }, [value]);

  const handleChange = (t: string) => {
    setTexto(t);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(t), 300);
  };

  const handleClear = () => {
    setTexto('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={18} color={colors.grayDark} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.grayMid}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {texto.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.grayMid} />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  icon: {
    flexShrink: 0,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    padding: 0,
  },
});
