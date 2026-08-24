import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '@/theme';

const TAMANO_ASA = 28;
const TAMANO_MINIMO = 60;
const MARGEN_INICIAL = 0.08;

function clamp(valor: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(valor, min), max);
}

interface Props {
  uri: string;
  anchoNatural: number;
  altoNatural: number;
  onConfirmar: (uriRecortada: string) => void;
  onCancelar: () => void;
}

export function RecortadorTicket({ uri, anchoNatural, altoNatural, onConfirmar, onCancelar }: Props) {
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();
  const [procesando, setProcesando] = useState(false);

  const anchoMaximo = anchoPantalla - spacing.lg * 2;
  const altoMaximo = altoPantalla * 0.6;
  const escala = Math.min(anchoMaximo / anchoNatural, altoMaximo / altoNatural);
  const anchoMostrado = anchoNatural * escala;
  const altoMostrado = altoNatural * escala;

  const left = useSharedValue(anchoMostrado * MARGEN_INICIAL);
  const top = useSharedValue(altoMostrado * MARGEN_INICIAL);
  const right = useSharedValue(anchoMostrado * (1 - MARGEN_INICIAL));
  const bottom = useSharedValue(altoMostrado * (1 - MARGEN_INICIAL));

  // Cada esquina mueve dos bordes a la vez (p. ej. arriba-izquierda mueve left y top),
  // sin fijar ninguna proporción: el rectángulo puede quedar con cualquier forma.
  const gestoSuperiorIzquierdo = Gesture.Pan()
    .hitSlop(16)
    .onChange((e) => {
      left.value = clamp(left.value + e.changeX, 0, right.value - TAMANO_MINIMO);
      top.value = clamp(top.value + e.changeY, 0, bottom.value - TAMANO_MINIMO);
    });

  const gestoSuperiorDerecho = Gesture.Pan()
    .hitSlop(16)
    .onChange((e) => {
      right.value = clamp(right.value + e.changeX, left.value + TAMANO_MINIMO, anchoMostrado);
      top.value = clamp(top.value + e.changeY, 0, bottom.value - TAMANO_MINIMO);
    });

  const gestoInferiorIzquierdo = Gesture.Pan()
    .hitSlop(16)
    .onChange((e) => {
      left.value = clamp(left.value + e.changeX, 0, right.value - TAMANO_MINIMO);
      bottom.value = clamp(bottom.value + e.changeY, top.value + TAMANO_MINIMO, altoMostrado);
    });

  const gestoInferiorDerecho = Gesture.Pan()
    .hitSlop(16)
    .onChange((e) => {
      right.value = clamp(right.value + e.changeX, left.value + TAMANO_MINIMO, anchoMostrado);
      bottom.value = clamp(bottom.value + e.changeY, top.value + TAMANO_MINIMO, altoMostrado);
    });

  const estiloBarraSuperior = useAnimatedStyle(() => ({ height: top.value }));
  const estiloBarraInferior = useAnimatedStyle(() => ({
    top: bottom.value,
    height: Math.max(altoMostrado - bottom.value, 0),
  }));
  const estiloBarraIzquierda = useAnimatedStyle(() => ({
    top: top.value,
    height: bottom.value - top.value,
    width: left.value,
  }));
  const estiloBarraDerecha = useAnimatedStyle(() => ({
    top: top.value,
    height: bottom.value - top.value,
    left: right.value,
    width: Math.max(anchoMostrado - right.value, 0),
  }));
  const estiloBorde = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    width: right.value - left.value,
    height: bottom.value - top.value,
  }));
  const estiloAsaSI = useAnimatedStyle(() => ({ left: left.value - TAMANO_ASA / 2, top: top.value - TAMANO_ASA / 2 }));
  const estiloAsaSD = useAnimatedStyle(() => ({ left: right.value - TAMANO_ASA / 2, top: top.value - TAMANO_ASA / 2 }));
  const estiloAsaII = useAnimatedStyle(() => ({ left: left.value - TAMANO_ASA / 2, top: bottom.value - TAMANO_ASA / 2 }));
  const estiloAsaID = useAnimatedStyle(() => ({ left: right.value - TAMANO_ASA / 2, top: bottom.value - TAMANO_ASA / 2 }));

  const handleConfirmar = async () => {
    setProcesando(true);
    try {
      const escalaInversa = anchoNatural / anchoMostrado;
      const originX = clamp(Math.round(left.value * escalaInversa), 0, anchoNatural - 1);
      const originY = clamp(Math.round(top.value * escalaInversa), 0, altoNatural - 1);
      const anchoRecorte = clamp(
        Math.round((right.value - left.value) * escalaInversa), 1, anchoNatural - originX
      );
      const altoRecorte = clamp(
        Math.round((bottom.value - top.value) * escalaInversa), 1, altoNatural - originY
      );

      const resultado = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX, originY, width: anchoRecorte, height: altoRecorte } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      onConfirmar(resultado.uri);
    } catch {
      // Si el recorte falla por lo que sea, seguimos con la foto original en vez de
      // dejar al usuario bloqueado sin poder continuar.
      onConfirmar(uri);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCancelar}>
      {/* react-native-gesture-handler necesita su propio root dentro de un Modal de RN:
          el Modal monta su contenido en una jerarquía nativa separada, fuera del
          GestureHandlerRootView del layout raíz de la app. */}
      <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.contenedor} edges={['top', 'bottom']}>
        <Text style={styles.titulo}>Recorta solo los alimentos</Text>
        <Text style={styles.subtitulo}>
          Arrastra las esquinas para dejar fuera cualquier dato de la tienda
        </Text>

        <View style={[styles.imagenContenedor, { width: anchoMostrado, height: altoMostrado }]}>
          <Image source={{ uri }} style={{ width: anchoMostrado, height: altoMostrado }} contentFit="fill" />

          <Animated.View style={[styles.barra, estiloBarraSuperior]} pointerEvents="none" />
          <Animated.View style={[styles.barra, estiloBarraInferior]} pointerEvents="none" />
          <Animated.View style={[styles.barra, estiloBarraIzquierda]} pointerEvents="none" />
          <Animated.View style={[styles.barra, estiloBarraDerecha]} pointerEvents="none" />
          <Animated.View style={[styles.bordeRecorte, estiloBorde]} pointerEvents="none" />

          <GestureDetector gesture={gestoSuperiorIzquierdo}>
            <Animated.View style={[styles.asa, estiloAsaSI]} />
          </GestureDetector>
          <GestureDetector gesture={gestoSuperiorDerecho}>
            <Animated.View style={[styles.asa, estiloAsaSD]} />
          </GestureDetector>
          <GestureDetector gesture={gestoInferiorIzquierdo}>
            <Animated.View style={[styles.asa, estiloAsaII]} />
          </GestureDetector>
          <GestureDetector gesture={gestoInferiorDerecho}>
            <Animated.View style={[styles.asa, estiloAsaID]} />
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
              <Text style={styles.btnConfirmarTexto}>Confirmar recorte</Text>
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
  bordeRecorte: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
  },
  asa: {
    position: 'absolute',
    width: TAMANO_ASA,
    height: TAMANO_ASA,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
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
