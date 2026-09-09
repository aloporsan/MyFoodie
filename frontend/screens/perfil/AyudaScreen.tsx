import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
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

// Panel de ayuda accesible desde el perfil: mismo formato de carrusel que el onboarding
// (RF-UX-001 / #172) pero con explicaciones más detalladas de cada parte de la app.
const SLIDES: Slide[] = [
  {
    key: 'despensa',
    icono: 'file-tray-stacked-outline',
    titulo: 'La despensa',
    descripcion:
      'Añade cada producto con su cantidad y fecha de caducidad. MyFoodie calcula su estado (caduca hoy, pronto, esta semana...) y te avisa antes de que se estropee. Puedes gestionar un producto por lotes si tienes varias unidades con fechas distintas.',
  },
  {
    key: 'dashboard',
    icono: 'grid-outline',
    titulo: 'El inicio',
    descripcion:
      'Un resumen de un vistazo: qué está a punto de caducar, tu carrito inteligente, la lista de la compra en curso y tu aprovechamiento de la despensa.',
  },
  {
    key: 'feed',
    icono: 'swap-horizontal-outline',
    titulo: 'El feed de recetas',
    descripcion:
      'Desliza a la derecha para guardar una receta y a la izquierda para descartarla. Con cada gesto aprendemos tus gustos. Las recetas descartadas no vuelven a salir. Filtra por categoría, dificultad, tiempo o "solo lo que puedo cocinar".',
  },
  {
    key: 'carrito',
    icono: 'cart-outline',
    titulo: 'El carrito inteligente',
    descripcion:
      'A partir de tu despensa y de las recetas que te interesan, te sugiere qué comprar y con qué prioridad. Acepta o rechaza cada sugerencia (también deslizando) y genera una lista de la compra con lo aceptado.',
  },
  {
    key: 'lista',
    icono: 'checkbox-outline',
    titulo: 'La lista de la compra',
    descripcion:
      'Marca lo que vas comprando y, al terminar, añade todo a la despensa de una vez. Los productos similares que ya tienes se detectan para que no se dupliquen.',
  },
  {
    key: 'recetas',
    icono: 'restaurant-outline',
    titulo: 'Tus recetas',
    descripcion:
      'Crea tus propias recetas con ingredientes, pasos y una foto de portada (obligatoria para publicar). Guárdalas como borrador y publícalas cuando estén al 100%.',
  },
  {
    key: 'perfil',
    icono: 'person-circle-outline',
    titulo: 'Tu perfil y preferencias',
    descripcion:
      'En Preferencias alimentarias defines tu dieta y tus alérgenos: las recetas con esos ingredientes no aparecerán en tu feed. En Estadísticas ves tu eficiencia y puedes vaciar la despensa por completo.',
  },
];

export function AyudaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);

  const esUltima = indice === SLIDES.length - 1;

  const irASlide = (siguiente: number) => {
    setIndice(siguiente);
    scrollRef.current?.scrollTo({ x: width * siguiente, animated: true });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nuevo = Math.round(e.nativeEvent.contentOffset.x / width);
    if (nuevo !== indice) setIndice(nuevo);
  };

  const handleBoton = () => {
    if (esUltima) {
      router.back();
      return;
    }
    irASlide(indice + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitulo}>Cómo funciona MyFoodie</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="ayuda-cerrar">
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </Pressable>
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
          <View key={slide.key} style={[styles.slide, { width }]} testID={`ayuda-slide-${slide.key}`}>
            <View style={styles.iconoWrapper}>
              <Ionicons name={slide.icono} size={64} color={colors.primary} />
            </View>
            <Text style={styles.titulo}>{slide.titulo}</Text>
            <Text style={styles.descripcion}>{slide.descripcion}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.key} style={[styles.dot, i === indice && styles.dotActivo]} />
        ))}
      </View>

      <Pressable style={styles.btn} onPress={handleBoton} testID="ayuda-boton">
        <Text style={styles.btnTexto}>{esUltima ? 'Entendido' : 'Siguiente'}</Text>
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
    paddingBottom: spacing.sm,
  },
  topTitulo: { ...typography.heading3, color: colors.text.primary },
  slidesScroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconoWrapper: {
    width: 128,
    height: 128,
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
  btn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  btnTexto: { ...typography.button, color: colors.white },
});
