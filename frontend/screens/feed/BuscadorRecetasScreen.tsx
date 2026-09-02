import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ETIQUETAS_SUGERIDAS } from '@/constants/etiquetas';
import { useToastStore } from '@/hooks/useToast';
import { recetaBusquedaService } from '@/services/recetaBusquedaService';
import type { Receta } from '@/services/recetaService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { resolveImagenUrl } from '@/utils/media';

const DEBOUNCE_MS = 400;
const ETIQUETAS_POPULARES = ETIQUETAS_SUGERIDAS.slice(0, 8);

export function BuscadorRecetasScreen() {
  const router = useRouter();

  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Receta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busquedaLanzada, setBusquedaLanzada] = useState(false);
  const peticionRef = useRef(0);

  useEffect(() => {
    const q = texto.trim();
    if (!q) {
      setResultados([]);
      setBusquedaLanzada(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const idPeticion = ++peticionRef.current;
    const timer = setTimeout(async () => {
      try {
        const recetas = await recetaBusquedaService.buscarRecetas(q);
        if (peticionRef.current === idPeticion) {
          setResultados(recetas);
          setBusquedaLanzada(true);
        }
      } catch {
        if (peticionRef.current === idPeticion) {
          useToastStore.getState().show('error', 'No se pudo completar la búsqueda');
        }
      } finally {
        if (peticionRef.current === idPeticion) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [texto]);

  const hayTexto = texto.trim().length > 0;
  const sinResultados = busquedaLanzada && !isLoading && resultados.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} testID="btn-volver">
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={20} color={colors.grayDark} />
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar recetas..."
            placeholderTextColor={colors.grayMid}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
            testID="input-buscar-recetas"
          />
          {hayTexto && (
            <Pressable onPress={() => setTexto('')} hitSlop={8} testID="btn-limpiar">
              <Ionicons name="close-circle" size={20} color={colors.grayMid} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.toggle}>
        <View style={[styles.toggleOpcion, styles.toggleOpcionActiva]}>
          <Text style={[styles.toggleTexto, styles.toggleTextoActivo]}>Recetas</Text>
        </View>
        <Pressable
          style={styles.toggleOpcion}
          onPress={() => router.replace('/social/buscar')}
          testID="btn-buscar-usuarios"
        >
          <Text style={styles.toggleTexto}>Usuarios</Text>
        </Pressable>
      </View>

      {isLoading && resultados.length === 0 ? (
        <LoadingScreen />
      ) : hayTexto && !sinResultados ? (
        <FlatList
          data={resultados}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <ResultadoReceta receta={item} onPress={() => router.push(`/feed/${item.id}`)} />
          )}
        />
      ) : (
        <EstadoVacio
          titulo={sinResultados ? 'Sin resultados' : 'Busca recetas'}
          subtitulo={
            sinResultados
              ? `No encontramos recetas para "${texto.trim()}". Prueba con otra palabra o una etiqueta.`
              : 'Escribe el nombre de una receta, un ingrediente o una etiqueta.'
          }
          onSugerencia={(etiqueta) => setTexto(etiqueta)}
        />
      )}
    </SafeAreaView>
  );
}

function ResultadoReceta({ receta, onPress }: { receta: Receta; onPress: () => void }) {
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);

  return (
    <Pressable style={styles.card} onPress={onPress} testID={`resultado-receta-${receta.id}`}>
      {imagenUrl ? (
        <Image source={{ uri: imagenUrl }} style={styles.cardImagen} contentFit="cover" />
      ) : (
        <View style={[styles.cardImagen, styles.cardImagenPlaceholder]}>
          <Ionicons name="restaurant-outline" size={24} color={colors.white} />
        </View>
      )}
      <View style={styles.cardCuerpo}>
        <Text style={styles.cardTitulo} numberOfLines={1}>
          {receta.titulo}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.cardMetaTexto}>{receta.tiempoEstimado} min</Text>
          <Ionicons name="heart-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.cardMetaTexto}>{receta.totalLikes ?? 0}</Text>
        </View>
        {receta.etiquetas.length > 0 && (
          <View style={styles.cardEtiquetas}>
            {receta.etiquetas.slice(0, 3).map((etiqueta) => (
              <View key={etiqueta} style={styles.cardEtiqueta}>
                <Text style={styles.cardEtiquetaTexto}>{etiqueta}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function EstadoVacio({
  titulo,
  subtitulo,
  onSugerencia,
}: {
  titulo: string;
  subtitulo: string;
  onSugerencia: (etiqueta: string) => void;
}) {
  return (
    <View style={styles.vacio}>
      <View style={styles.vacioIcono}>
        <Ionicons name="search" size={40} color={colors.primary} />
      </View>
      <Text style={styles.vacioTitulo}>{titulo}</Text>
      <Text style={styles.vacioTexto}>{subtitulo}</Text>

      <Text style={styles.sugerenciasLabel}>Etiquetas populares</Text>
      <View style={styles.sugerencias}>
        {ETIQUETAS_POPULARES.map((etiqueta) => (
          <Pressable
            key={etiqueta}
            style={styles.sugerencia}
            onPress={() => onSugerencia(etiqueta)}
            testID={`sugerencia-${etiqueta}`}
          >
            <Text style={styles.sugerenciaTexto}>{etiqueta}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  input: { ...typography.body, color: colors.text.primary, flex: 1, padding: 0 },
  toggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  toggleOpcion: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
  },
  toggleOpcionActiva: { backgroundColor: colors.primary },
  toggleTexto: { ...typography.label, color: colors.text.secondary, fontWeight: '700' },
  toggleTextoActivo: { color: colors.white },

  lista: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  cardImagen: { width: 72, height: 72, borderRadius: borderRadius.md },
  cardImagenPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCuerpo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  cardTitulo: { ...typography.label, color: colors.text.primary, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardMetaTexto: { ...typography.caption, color: colors.text.secondary, marginRight: spacing.sm },
  cardEtiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cardEtiqueta: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  cardEtiquetaTexto: { ...typography.caption, color: colors.text.secondary },

  vacio: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, gap: spacing.sm },
  vacioIcono: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  vacioTitulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
  vacioTexto: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  sugerenciasLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignSelf: 'flex-start' },
  sugerencia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  sugerenciaTexto: { ...typography.caption, color: colors.text.secondary },
});
