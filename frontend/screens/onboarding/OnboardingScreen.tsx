import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '@/theme';

type Slide = {
  key: string;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
};

const SLIDES: Slide[] = [
  {
    key: 'bienvenida',
    icono: 'restaurant-outline',
    titulo: 'Bienvenido a MyFoodie',
    descripcion: 'Tu asistente culinario inteligente. Te ayudamos a aprovechar lo que tienes y a decidir qué cocinar.',
  },
  {
    key: 'despensa',
    icono: 'file-tray-stacked-outline',
    titulo: 'Tu despensa',
    descripcion: 'Registra tus productos y sus fechas de caducidad. MyFoodie te avisa de lo que está a punto de caducar para que nada se desperdicie.',
  },
  {
    key: 'feed',
    icono: 'swap-horizontal-outline',
    titulo: 'El feed',
    descripcion: 'Desliza para descartar o guardar recetas. Con cada gesto aprendemos tus gustos y afinamos las recomendaciones.',
  },
  {
    key: 'carrito',
    icono: 'cart-outline',
    titulo: 'El carrito inteligente',
    descripcion: 'A partir de tu despensa y de las recetas que te interesan, generamos sugerencias de compra con lo que te falta.',
  },
  {
    key: 'listo',
    icono: 'checkmark-circle-outline',
    titulo: '¡Todo listo!',
    descripcion: 'Empieza añadiendo tu primer producto a la despensa y deja que MyFoodie haga el resto.',
  },
];

interface OnboardingScreenProps {
  /** Se invoca al completar la última pantalla o al pulsar "Omitir". */
  onFinish: () => void;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);

  const esUltima = indice === SLIDES.length - 1;

  const irASlide = (siguiente: number) => {
    setIndice(siguiente);
    scrollRef.current?.scrollTo({ x: width * siguiente, animated: true });
  };

  const handleSiguiente = () => {
    if (esUltima) {
      onFinish();
      return;
    }
    irASlide(indice + 1);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nuevo = Math.round(e.nativeEvent.contentOffset.x / width);
    if (nuevo !== indice) setIndice(nuevo);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Image
          source={require('@/assets/images/logo-myfoodie.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {!esUltima ? (
          <Pressable onPress={onFinish} hitSlop={12} testID="onboarding-omitir">
            <Text style={styles.omitirTexto}>Omitir</Text>
          </Pressable>
        ) : (
          <View style={styles.omitirPlaceholder} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.slidesScroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]} testID={`onboarding-slide-${slide.key}`}>
            <View style={styles.iconoWrapper}>
              <Ionicons name={slide.icono} size={72} color={colors.primary} />
            </View>
            <Text style={styles.titulo}>{slide.titulo}</Text>
            <Text style={styles.descripcion}>{slide.descripcion}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.key}
            testID={`onboarding-dot-${i}`}
            style={[styles.dot, i === indice && styles.dotActivo]}
          />
        ))}
      </View>

      <Pressable style={styles.btnSiguiente} onPress={handleSiguiente} testID="onboarding-siguiente">
        <Text style={styles.btnSiguienteTexto}>{esUltima ? 'Empezar' : 'Siguiente'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  logo: { width: 40, height: 40 },
  omitirTexto: { ...typography.label, color: colors.text.secondary },
  omitirPlaceholder: { width: 40, height: 20 },
  slidesScroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconoWrapper: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titulo: { ...typography.heading1, color: colors.text.primary, textAlign: 'center' },
  descripcion: { ...typography.bodyLarge, color: colors.text.secondary, textAlign: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray,
  },
  dotActivo: {
    width: 24,
    backgroundColor: colors.primary,
  },
  btnSiguiente: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  btnSiguienteTexto: { ...typography.button, color: colors.white },
});
