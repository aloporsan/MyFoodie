import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { RecetaCard } from './RecetaCard';
import { RecetaFeed } from '@/services/feedService';
import { borderRadius } from '@/theme/borderRadius';

const UMBRAL_SWIPE = 100;
const DURACION_TRANSICION = 200;
const ESCALA_POR_POSICION = 0.04;
const TRASLADO_Y_POR_POSICION = 10;

interface GestosCardProps {
  receta: RecetaFeed;
  posicion: number;
  onGuardar: () => void;
  onDescartar: () => void;
  onLike: () => void;
  onPress?: () => void;
  onAutorPress?: () => void;
}

export function GestosCard({
  receta,
  posicion,
  onGuardar,
  onDescartar,
  onLike,
  onPress,
  onAutorPress,
}: GestosCardProps) {
  const esFrente = posicion === 0;

  const translateX = useSharedValue(0);
  const escala = useSharedValue(1 - posicion * ESCALA_POR_POSICION);
  const translateY = useSharedValue(posicion * TRASLADO_Y_POR_POSICION);
  const likeScale = useSharedValue(0);
  const [mostrarLike, setMostrarLike] = useState(false);

  // La misma tarjeta (mismo receta.id) se reutiliza al pasar de fondo a frente, así que
  // solo animamos el cambio de posición en vez de depender de un montaje/desmontaje.
  useEffect(() => {
    escala.value = withTiming(1 - posicion * ESCALA_POR_POSICION, { duration: DURACION_TRANSICION });
    translateY.value = withTiming(posicion * TRASLADO_Y_POR_POSICION, { duration: DURACION_TRANSICION });
  }, [posicion]);

  const dispararLike = () => {
    setMostrarLike(true);
    likeScale.value = withSpring(1, undefined, (finished) => {
      if (finished) {
        likeScale.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(setMostrarLike)(false);
        });
      }
    });
    onLike();
  };

  const panGesture = Gesture.Pan()
    .enabled(esFrente)
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > UMBRAL_SWIPE) {
        translateX.value = withTiming(500, { duration: 200 }, () => {
          translateX.value = 0;
        });
        runOnJS(onGuardar)();
      } else if (event.translationX < -UMBRAL_SWIPE) {
        translateX.value = withTiming(-500, { duration: 200 }, () => {
          translateX.value = 0;
        });
        runOnJS(onDescartar)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const dobleToqueGesture = Gesture.Tap()
    .enabled(esFrente)
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(dispararLike)();
    });

  // Gesto propio del autor (foto+nombre), envuelto en su propio GestureDetector dentro de
  // RecetaCard. toqueSimpleGesture espera a que este falle antes de activarse, así un tap
  // sobre el autor navega solo al perfil y no también al detalle de la receta.
  const autorTapGesture = Gesture.Tap()
    .enabled(esFrente)
    .hitSlop(8)
    .onEnd(() => {
      if (onAutorPress) runOnJS(onAutorPress)();
    });

  const toqueSimpleGesture = Gesture.Tap()
    .enabled(esFrente)
    .numberOfTaps(1)
    .requireExternalGestureToFail(autorTapGesture)
    .onEnd(() => {
      if (onPress) runOnJS(onPress)();
    });

  const tapGesture = Gesture.Exclusive(dobleToqueGesture, toqueSimpleGesture);
  const gesto = Gesture.Race(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: escala.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  const overlayGuardarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? Math.min(translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  const overlayDescartarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? Math.min(-translateX.value / UMBRAL_SWIPE, 1) : 0,
  }));

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
    opacity: likeScale.value,
  }));

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        style={[styles.container, cardStyle]}
        pointerEvents={esFrente ? 'auto' : 'none'}
      >
        <RecetaCard
          receta={receta}
          autorGesture={esFrente ? autorTapGesture : undefined}
        />

        <Animated.View
          testID="overlay-guardar"
          style={[styles.overlay, styles.overlayGuardar, overlayGuardarStyle]}
          pointerEvents="none"
        >
          <Ionicons name="bookmark" size={64} color="#FFFFFF" />
        </Animated.View>

        <Animated.View
          testID="overlay-descartar"
          style={[styles.overlay, styles.overlayDescartar, overlayDescartarStyle]}
          pointerEvents="none"
        >
          <Ionicons name="close" size={64} color="#FFFFFF" />
        </Animated.View>

        {mostrarLike && (
          <Animated.View
            testID="overlay-like"
            style={[styles.overlay, likeAnimStyle]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={96} color="#FFFFFF" />
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayGuardar: {
    backgroundColor: 'rgba(127, 198, 42, 0.55)',
  },
  overlayDescartar: {
    backgroundColor: 'rgba(229, 57, 53, 0.55)',
  },
});
