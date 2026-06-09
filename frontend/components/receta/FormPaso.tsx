import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PasoInput } from '@/services/recetaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  onGuardar: (datos: PasoInput) => Promise<void>;
  isLoading?: boolean;
}

export function FormPaso({ onGuardar, isLoading = false }: Props) {
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [error, setError] = useState('');

  const handleGuardar = async () => {
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    setError('');
    await onGuardar({
      descripcion: descripcion.trim(),
      imagenUrl: imagenUrl.trim() || undefined,
    });
    setDescripcion('');
    setImagenUrl('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, styles.textarea, error && styles.inputError]}
        value={descripcion}
        onChangeText={(v) => { setDescripcion(v); setError(''); }}
        placeholder="Describe el paso *"
        placeholderTextColor={colors.grayMid}
        multiline
        numberOfLines={3}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        value={imagenUrl}
        onChangeText={setImagenUrl}
        placeholder="URL de imagen del paso (opcional)"
        placeholderTextColor={colors.grayMid}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <Pressable
        style={[styles.btnAñadir, isLoading && styles.btnDisabled]}
        onPress={handleGuardar}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.btnText}>+ Añadir paso</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.error },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { ...typography.caption, color: colors.error },
  btnAñadir: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...typography.label, color: colors.white },
});
