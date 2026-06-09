import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  InputAccessoryView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PasoInput } from '@/services/recetaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const ACCESSORY_ID = 'formPasoAccessory';

interface Props {
  onGuardar: (datos: PasoInput) => Promise<void>;
  isLoading?: boolean;
}

export function FormPaso({ onGuardar, isLoading = false }: Props) {
  const [descripcion, setDescripcion] = useState('');
  const [imagenUri, setImagenUri] = useState<string | undefined>();
  const [error, setError] = useState('');

  const seleccionarImagen = async (fuente: 'galeria' | 'camara') => {
    if (fuente === 'galeria') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImagenUri(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImagenUri(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    }
  };

  const handleGuardar = async () => {
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    setError('');
    await onGuardar({ descripcion: descripcion.trim(), imagenUrl: imagenUri });
    setDescripcion('');
    setImagenUri(undefined);
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
        inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Imagen del paso */}
      {imagenUri ? (
        <View style={styles.imagenPreview}>
          <Image source={{ uri: imagenUri }} style={styles.thumbnail} resizeMode="cover" />
          <Pressable style={styles.btnQuitarImagen} onPress={() => setImagenUri(undefined)}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.imagenBtns}>
          <Pressable style={styles.btnImagen} onPress={() => seleccionarImagen('galeria')}>
            <Ionicons name="images-outline" size={16} color={colors.grayDark} />
            <Text style={styles.btnImagenText}>Galería</Text>
          </Pressable>
          <Pressable style={styles.btnImagen} onPress={() => seleccionarImagen('camara')}>
            <Ionicons name="camera-outline" size={16} color={colors.grayDark} />
            <Text style={styles.btnImagenText}>Cámara</Text>
          </Pressable>
        </View>
      )}

      {/* On Android: regular inline button. On iOS: button is in InputAccessoryView above keyboard */}
      {Platform.OS !== 'ios' && (
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
      )}

      {Platform.OS === 'ios' && (
        <>
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
          <InputAccessoryView nativeID={ACCESSORY_ID}>
            <View style={styles.toolbar}>
              <Pressable
                style={[styles.toolbarBtn, isLoading && styles.btnDisabled]}
                onPress={handleGuardar}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color={colors.white} />
                    <Text style={styles.toolbarBtnText}>Añadir paso</Text>
                  </>
                )}
              </Pressable>
            </View>
          </InputAccessoryView>
        </>
      )}
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
  imagenBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnImagen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray,
    borderStyle: 'dashed',
  },
  btnImagenText: { ...typography.caption, color: colors.grayDark },
  imagenPreview: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  btnQuitarImagen: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  btnAñadir: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...typography.label, color: colors.white },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toolbarBtnText: { ...typography.label, color: colors.white },
});
