import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { showConfirm } from '@/hooks/useConfirm';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface ImagenTicketSeleccionada {
  uri: string;
  nombre: string;
  tipo: string;
}

interface Props {
  imagen: ImagenTicketSeleccionada | null;
  onSeleccionarImagen: (imagen: ImagenTicketSeleccionada) => void;
  disabled?: boolean;
}

const mensajePermisoDenegado = (recurso: string) =>
  showConfirm(
    'Permiso necesario',
    `Necesitamos acceso a tu ${recurso} para escanear el ticket. Actívalo en los ajustes del sistema.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Ir a ajustes', onPress: () => Linking.openSettings() },
    ],
    { icon: 'settings-outline', variant: 'warning' }
  );

export function SelectorImagenTicket({ imagen, onSeleccionarImagen, disabled = false }: Props) {
  const [cargando, setCargando] = useState(false);

  const procesarResultado = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const extension = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    onSeleccionarImagen({
      uri: asset.uri,
      nombre: asset.fileName ?? `ticket.${extension}`,
      tipo: asset.mimeType ?? `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    });
  };

  const abrirGaleria = async () => {
    setCargando(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        mensajePermisoDenegado('galería');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        quality: 0.8,
      });
      procesarResultado(result);
    } finally {
      setCargando(false);
    }
  };

  const abrirCamara = async () => {
    setCargando(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        mensajePermisoDenegado('cámara');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      procesarResultado(result);
    } finally {
      setCargando(false);
    }
  };

  const ocupado = cargando || disabled;

  return (
    <View style={styles.container}>
      <Pressable style={styles.imagenWrapper} onPress={abrirGaleria} disabled={ocupado}>
        {imagen ? (
          <Image source={{ uri: imagen.uri }} style={styles.imagen} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="receipt-outline" size={48} color={colors.grayMid} />
            <Text style={styles.placeholderText}>Toca para escanear un ticket</Text>
          </View>
        )}
        {cargando && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
      </Pressable>

      <View style={styles.botones}>
        <Pressable style={styles.btn} onPress={abrirCamara} disabled={ocupado}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={styles.btnText}>Tomar foto</Text>
        </Pressable>
        <View style={styles.separador} />
        <Pressable style={styles.btn} onPress={abrirGaleria} disabled={ocupado}>
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={styles.btnText}>{imagen ? 'Cambiar imagen' : 'Seleccionar de galería'}</Text>
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
    // Los tickets se fotografían casi siempre en vertical: una proporción alta
    // aprovecha mejor la preview antes de procesar.
    aspectRatio: 0.68,
  },
  imagen: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
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
