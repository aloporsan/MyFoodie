import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { FiltrosRecetaSheet } from '@/components/feed';
import { RecetaCardCompacta } from '@/components/receta';
import {
  contarFiltros,
  FILTROS_RECETA_VACIOS,
  FiltrosReceta,
  UMBRAL_DESPENSA,
} from '@/constants/filtrosReceta';
import { useToastStore } from '@/hooks/useToast';
import { feedService, type RecetaFeed } from '@/services/feedService';
import { borderRadius, colors, spacing, typography } from '@/theme';

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

  // "Solo lo que puedo cocinar" se aplica en cliente sobre la coincidencia de despensa, como el feed.
  const resultadosVisibles = filtros.soloDespensa
    ? resultados.filter((r) => r.coincidenciaDespensa >= UMBRAL_DESPENSA)
    : resultados;

  const hayTexto = texto.trim().length > 0;
  const sinResultados = busquedaLanzada && !isLoading && resultadosVisibles.length === 0;

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

      {isLoading && resultadosVisibles.length === 0 ? (
        <LoadingScreen />
      ) : hayTexto && !sinResultados ? (
        <FlatList
          data={resultadosVisibles}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <RecetaCardCompacta
              receta={item}
              onPress={() => router.push(`/feed/${item.id}`)}
              despensa={{
                disponibles: item.ingredientesDisponibles,
                faltantes: item.ingredientesFaltantes,
              }}
              testID={`resultado-receta-${item.id}`}
            />
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
        mostrarDespensa
        onCerrar={() => setSheetVisible(false)}
        onAplicar={(nuevos) => {
          setSheetVisible(false);
          setFiltros(nuevos);
        }}
      />
    </SafeAreaView>
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
