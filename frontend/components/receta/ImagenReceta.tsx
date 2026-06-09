import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  imagenUrl?: string;
  onActualizar: (url: string) => Promise<void>;
  isLoading?: boolean;
}

export function ImagenReceta({ imagenUrl, onActualizar, isLoading = false }: Props) {
  const [editando, setEditando] = useState(false);
  const [urlBorrador, setUrlBorrador] = useState(imagenUrl ?? '');

  const handleGuardar = async () => {
    const url = urlBorrador.trim();
    if (!url) return;
    await onActualizar(url);
    setEditando(false);
  };

  const handleCancelar = () => {
    setUrlBorrador(imagenUrl ?? '');
    setEditando(false);
  };

  return (
    <View style={styles.container}>
      {imagenUrl ? (
        <Image source={{ uri: imagenUrl }} style={styles.imagen} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={48} color={colors.grayMid} />
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}

      {editando ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            value={urlBorrador}
            onChangeText={setUrlBorrador}
            placeholder="https://..."
            placeholderTextColor={colors.grayMid}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Pressable
            style={[styles.btnGuardar, isLoading && styles.btnDisabled]}
            onPress={handleGuardar}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="checkmark" size={18} color={colors.white} />
            )}
          </Pressable>
          <Pressable style={styles.btnCancelar} onPress={handleCancelar}>
            <Ionicons name="close" size={18} color={colors.grayDark} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.btnCambiar} onPress={() => setEditando(true)}>
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          <Text style={styles.btnCambiarText}>
            {imagenUrl ? 'Cambiar imagen' : 'Añadir imagen'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.grayLight,
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    color: colors.grayMid,
  },
  editRow: {
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
    borderColor: colors.primary,
  },
  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnCancelar: {
    backgroundColor: colors.gray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCambiar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  btnCambiarText: {
    ...typography.label,
    color: colors.primary,
  },
});
