import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { FiltrosRecetaSheet } from '@/components/feed';
import {
  contarFiltros,
  FILTROS_RECETA_VACIOS,
  FiltrosReceta,
} from '@/constants/filtrosReceta';
import { useToastStore } from '@/hooks/useToast';
import { feedService, type RecetaFeed } from '@/services/feedService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { resolveImagenUrl } from '@/utils/media';

const DEBOUNCE_MS = 400;

export function BuscadorRecetasScreen() {
  const router = useRouter();

  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState<FiltrosReceta>(FILTROS_RECETA_VACIOS);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [resultados, setResultados] = useState<RecetaFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busquedaLanzada, setBusquedaLanzada] = useState(false);
  const peticionRef = useRef(0);

  const totalFiltros = contarFiltros(filtros);

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
        const recetas = await feedService.buscarRecetas(q, filtros);
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
  }, [texto, filtros]);

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
        <Pressable
          style={styles.btnFiltros}
          onPress={() => setSheetVisible(true)}
          hitSlop={8}
          testID="btn-abrir-filtros"
        >
          <Ionicons name="options-outline" size={20} color={colors.primary} />
          {totalFiltros > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{totalFiltros}</Text>
            </View>
          )}
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
        <View style={styles.vacio}>
          <View style={styles.vacioIcono}>
            <Ionicons name="search" size={40} color={colors.primary} />
          </View>
          <Text style={styles.vacioTitulo}>{sinResultados ? 'Sin resultados' : 'Busca recetas'}</Text>
          <Text style={styles.vacioTexto}>
            {sinResultados
              ? `No encontramos recetas para "${texto.trim()}"${
                  totalFiltros > 0 ? ' con esos filtros' : ''
                }. Prueba con otra palabra${totalFiltros > 0 ? ' o quita filtros' : ''}.`
              : 'Escribe el nombre de una receta, un ingrediente o una etiqueta.'}
          </Text>
        </View>
      )}

      <FiltrosRecetaSheet
        visible={sheetVisible}
        filtros={filtros}
        onCerrar={() => setSheetVisible(false)}
        onAplicar={(nuevos) => {
          setSheetVisible(false);
          setFiltros(nuevos);
        }}
      />
    </SafeAreaView>
  );
}

const DIFICULTAD_COLOR: Record<string, string> = {
  'fácil': colors.primary,
  media: colors.secondary,
  'difícil': colors.error,
};

function estadoDespensa(receta: RecetaFeed): { color: string; icono: keyof typeof Ionicons.glyphMap; texto: string } | null {
  const total = receta.ingredientesDisponibles + receta.ingredientesFaltantes;
  if (total === 0) return null;
  if (receta.ingredientesFaltantes === 0) {
    return { color: colors.primary, icono: 'checkmark-circle', texto: 'Tienes los ingredientes' };
  }
  if (receta.ingredientesDisponibles > 0) {
    return {
      color: colors.secondary,
      icono: 'remove-circle',
      texto: `Tienes ${receta.ingredientesDisponibles}/${total}`,
    };
  }
  return { color: colors.grayMid, icono: 'close-circle', texto: 'Te faltan ingredientes' };
}

function ResultadoReceta({ receta, onPress }: { receta: RecetaFeed; onPress: () => void }) {
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);
  const despensa = estadoDespensa(receta);
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad?.toLowerCase()] ?? colors.grayMid;

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

        <View style={styles.cardIconos}>
          <View style={[styles.pill, { backgroundColor: dificultadColor }]}>
            <Text style={styles.pillTexto}>{receta.dificultad}</Text>
          </View>
          {receta.categoria && (
            <View style={styles.metaItem}>
              <Ionicons name="restaurant-outline" size={13} color={colors.text.secondary} />
              <Text style={styles.metaTexto}>{receta.categoria}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.text.secondary} />
            <Text style={styles.metaTexto}>{receta.numPersonas}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
            <Text style={styles.metaTexto}>{receta.tiempoEstimado} min</Text>
          </View>
        </View>

        {despensa && (
          <View style={styles.despensaRow}>
            <Ionicons name={despensa.icono} size={14} color={despensa.color} />
            <Text style={[styles.despensaTexto, { color: despensa.color }]}>{despensa.texto}</Text>
          </View>
        )}
      </View>
    </Pressable>
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
  btnFiltros: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { ...typography.caption, fontSize: 10, lineHeight: 12, color: colors.white, fontWeight: '700' },

  lista: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  cardImagen: { width: 80, height: 80, borderRadius: borderRadius.md },
  cardImagenPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCuerpo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  cardTitulo: { ...typography.label, color: colors.text.primary, fontWeight: '700' },
  cardIconos: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  pillTexto: { ...typography.caption, fontSize: 10, color: colors.white, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTexto: { ...typography.caption, color: colors.text.secondary },
  despensaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  despensaTexto: { ...typography.caption, fontWeight: '600' },

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
});
