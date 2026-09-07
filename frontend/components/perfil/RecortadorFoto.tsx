import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '@/theme';

function clamp(valor: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(valor, min), max);
}

interface Props {
  uri: string;
  anchoNatural: number;
  altoNatural: number;
  /** Devuelve un data URI JPEG en base64 ya recortado (cuadrado). */
  onConfirmar: (dataUri: string) => void;
  onCancelar: () => void;
}

/**
 * Recorte de foto de perfil. A diferencia del recortador del ticket, aquí la selección es
 * un cuadrado de proporción fija: el usuario solo puede moverlo sobre la imagen (no arrastra
 * las esquinas ni deforma el recorte). La máscara circular muestra cómo quedará el avatar.
 */
export function RecortadorFoto({ uri, anchoNatural, altoNatural, onConfirmar, onCancelar }: Props) {
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();
  const [procesando, setProcesando] = useState(false);

  const anchoMaximo = anchoPantalla - spacing.lg * 2;
  const altoMaximo = altoPantalla * 0.6;
  const escala = Math.min(anchoMaximo / anchoNatural, altoMaximo / altoNatural);
  const anchoMostrado = anchoNatural * escala;
  const altoMostrado = altoNatural * escala;

  // Lado del cuadrado de recorte: el máximo que cabe dentro de la imagen mostrada.
  const lado = Math.min(anchoMostrado, altoMostrado);

  const left = useSharedValue((anchoMostrado - lado) / 2);
  const top = useSharedValue((altoMostrado - lado) / 2);

  const gestoMover = Gesture.Pan().onChange((e) => {
    left.value = clamp(left.value + e.changeX, 0, anchoMostrado - lado);
    top.value = clamp(top.value + e.changeY, 0, altoMostrado - lado);
  });

  const estiloVentana = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    width: lado,
    height: lado,
  }));
  const estiloBarraSuperior = useAnimatedStyle(() => ({ height: top.value }));
  const estiloBarraInferior = useAnimatedStyle(() => ({
    top: top.value + lado,
    height: Math.max(altoMostrado - top.value - lado, 0),
  }));
  const estiloBarraIzquierda = useAnimatedStyle(() => ({
    top: top.value,
    height: lado,
    width: left.value,
  }));
  const estiloBarraDerecha = useAnimatedStyle(() => ({
    top: top.value,
    height: lado,
    left: left.value + lado,
    width: Math.max(anchoMostrado - left.value - lado, 0),
  }));

  const handleConfirmar = async () => {
    setProcesando(true);
    try {
      const escalaInversa = anchoNatural / anchoMostrado;
      const ladoNatural = Math.round(lado * escalaInversa);
      const originX = clamp(Math.round(left.value * escalaInversa), 0, anchoNatural - ladoNatural);
      const originY = clamp(Math.round(top.value * escalaInversa), 0, altoNatural - ladoNatural);

      const resultado = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: { originX, originY, width: ladoNatural, height: ladoNatural } },
          { resize: { width: 512, height: 512 } },
        ],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      onConfirmar(
        resultado.base64 ? `data:image/jpeg;base64,${resultado.base64}` : resultado.uri
      );
    } catch {
      onConfirmar(uri);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCancelar}>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaView style={styles.contenedor} edges={['top', 'bottom']}>
          <Text style={styles.titulo}>Ajusta tu foto</Text>
          <Text style={styles.subtitulo}>Mueve el cuadro para encuadrar tu cara</Text>

          <View style={[styles.imagenContenedor, { width: anchoMostrado, height: altoMostrado }]}>
            <Image source={{ uri }} style={{ width: anchoMostrado, height: altoMostrado }} contentFit="fill" />

            <Animated.View style={[styles.barra, estiloBarraSuperior]} pointerEvents="none" />
            <Animated.View style={[styles.barra, estiloBarraInferior]} pointerEvents="none" />
            <Animated.View style={[styles.barra, estiloBarraIzquierda]} pointerEvents="none" />
            <Animated.View style={[styles.barra, estiloBarraDerecha]} pointerEvents="none" />

            <GestureDetector gesture={gestoMover}>
              <Animated.View style={[styles.ventana, estiloVentana]}>
                <View style={[styles.mascaraCircular, { width: lado, height: lado, borderRadius: lado / 2 }]} />
              </Animated.View>
            </GestureDetector>
          </View>

          <View style={styles.footer}>
            <Pressable style={[styles.btn, styles.btnCancelar]} onPress={onCancelar} disabled={procesando}>
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnConfirmar, procesando && styles.btnDisabled]}
              onPress={handleConfirmar}
              disabled={procesando}
            >
              {procesando ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.btnConfirmarTexto}>Usar esta foto</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenedor: {
    flex: 1,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titulo: { ...typography.heading3, color: colors.white, textAlign: 'center' },
  subtitulo: {
    ...typography.caption,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  imagenContenedor: { position: 'relative' },
  barra: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  ventana: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascaraCircular: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 'auto',
    marginBottom: spacing.lg,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelar: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.gray },
  btnCancelarTexto: { ...typography.button, color: colors.white },
  btnConfirmar: { backgroundColor: colors.primary },
  btnConfirmarTexto: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.6 },
});
