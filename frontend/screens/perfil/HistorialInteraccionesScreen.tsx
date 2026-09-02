import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Receta } from '@/services/recetaService';
import { TipoHistorialReceta, historialService } from '@/services/historialService';
import { handleApiError } from '@/utils/errorHandler';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { resolveImagenUrl } from '@/utils/media';

const TABS: { key: TipoHistorialReceta; label: string; icono: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'guardadas', label: 'Guardadas', icono: 'bookmark-outline' },
  { key: 'like', label: 'Like', icono: 'heart-outline' },
  { key: 'comentadas', label: 'Comentadas', icono: 'chatbubble-outline' },
  { key: 'vistas', label: 'Vistas', icono: 'time-outline' },
];

const VACIO_TEXTO: Record<TipoHistorialReceta, string> = {
  guardadas: 'Aún no has guardado ninguna receta',
  like: 'Aún no has dado like a ninguna receta',
  comentadas: 'Aún no has comentado ninguna receta',
  vistas: 'Todavía no has visto ninguna receta',
};

export function HistorialInteraccionesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TipoHistorialReceta>('guardadas');
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (tipo: TipoHistorialReceta) => {
    try {
      const datos = await historialService.obtenerHistorialRecetas(tipo);
      setRecetas(datos);
      setError(null);
    } catch (e) {
      setError(handleApiError(e));
      setRecetas([]);
    }
  }, []);

  useEffect(() => {
    setCargando(true);
    cargar(tab).finally(() => setCargando(false));
  }, [tab, cargar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar(tab);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Historial de recetas</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((t) => {
            const activo = t.key === tab;
            return (
              <Pressable
                key={t.key}
                style={[styles.tab, activo && styles.tabActivo]}
                onPress={() => setTab(t.key)}
              >
                <Ionicons
                  name={t.icono}
                  size={15}
                  color={activo ? colors.white : colors.text.secondary}
                />
                <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {cargando ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={recetas.length === 0 ? styles.centrado : styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Ionicons name="restaurant-outline" size={56} color={colors.grayMid} />
              <Text style={styles.emptyTitulo}>{error ?? VACIO_TEXTO[tab]}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <RecetaHistorialCard
              receta={item}
              onPress={() => router.push({ pathname: '/receta/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function RecetaHistorialCard({ receta, onPress }: { receta: Receta; onPress: () => void }) {
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);
  return (
    <Pressable style={cardStyles.container} onPress={onPress}>
      {imagenUrl ? (
        <Image source={{ uri: imagenUrl }} style={cardStyles.imagen} contentFit="cover" />
      ) : (
        <View style={[cardStyles.imagen, cardStyles.imagenPlaceholder]}>
          <Ionicons name="restaurant-outline" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      )}
      <View style={cardStyles.cuerpo}>
        <Text style={cardStyles.titulo} numberOfLines={2}>
          {receta.titulo}
        </Text>
        <View style={cardStyles.metaRow}>
          <View style={cardStyles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
            <Text style={cardStyles.metaTexto}>{receta.tiempoEstimado} min</Text>
          </View>
          <View style={cardStyles.metaItem}>
            <Ionicons name="heart-outline" size={13} color={colors.text.secondary} />
            <Text style={cardStyles.metaTexto}>{receta.totalLikes ?? 0}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.grayMid} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { ...typography.heading3, color: colors.text.primary },
  tabsWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  tabs: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
  },
  tabActivo: { backgroundColor: colors.primary },
  tabTexto: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  tabTextoActivo: { color: colors.white },
  lista: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  centrado: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyWrapper: { alignItems: 'center', gap: spacing.md },
  emptyTitulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
  },
  imagen: { width: 64, height: 64, borderRadius: borderRadius.md },
  imagenPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: { flex: 1, gap: spacing.xs },
  titulo: { ...typography.label, color: colors.text.primary },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTexto: { ...typography.caption, color: colors.text.secondary },
});
