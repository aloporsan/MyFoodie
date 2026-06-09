import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [cargando, setCargando] = useState(false);

  const procesarImagen = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    setCargando(true);
    try {
      await onActualizar(uri);
    } finally {
      setCargando(false);
    }
  };

  const abrirGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      quality: 0.7,
      base64: true,
    });
    await procesarImagen(result);
  };

  const abrirCamara = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara para tomar una foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });
    await procesarImagen(result);
  };

  const ocupado = cargando || isLoading;

  return (
    <View style={styles.container}>
      <Pressable style={styles.imagenWrapper} onPress={abrirGaleria}>
        {imagenUrl ? (
          <Image source={{ uri: imagenUrl }} style={styles.imagen} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={48} color={colors.grayMid} />
            <Text style={styles.placeholderText}>Toca para añadir imagen</Text>
          </View>
        )}
        {ocupado && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
      </Pressable>

      <View style={styles.botones}>
        <Pressable style={styles.btn} onPress={abrirGaleria} disabled={ocupado}>
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={styles.btnText}>Galería</Text>
        </Pressable>
        <View style={styles.separador} />
        <Pressable style={styles.btn} onPress={abrirCamara} disabled={ocupado}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={styles.btnText}>Cámara</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  imagenWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.grayLight,
  },
  imagen: { width: '100%', height: 200 },
  placeholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: { ...typography.body, color: colors.grayMid },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botones: {
    flexDirection: 'row',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  btnText: { ...typography.label, color: colors.primary },
  separador: { width: 1, backgroundColor: colors.gray },
});
