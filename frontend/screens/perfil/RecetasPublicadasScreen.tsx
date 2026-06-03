import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

interface RecetaPlaceholder {
  id: string;
  titulo: string;
  tiempo: number;
  dificultad: string;
  vistas: number;
  gradiente: [string, string];
}

const RECETAS_MOCK: RecetaPlaceholder[] = [
  {
    id: '1',
    titulo: 'Tortilla española clásica',
    tiempo: 25,
    dificultad: 'Fácil',
    vistas: 142,
    gradiente: [colors.primary, colors.primaryDark],
  },
  {
    id: '2',
    titulo: 'Lentejas con chorizo',
    tiempo: 50,
    dificultad: 'Fácil',
    vistas: 89,
    gradiente: ['#F4A000', '#E8890A'],
  },
  {
    id: '3',
    titulo: 'Paella valenciana',
    tiempo: 90,
    dificultad: 'Difícil',
    vistas: 317,
    gradiente: ['#FF6B6B', '#C0392B'],
  },
];

export function RecetasPublicadasScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [recetas] = useState<RecetaPlaceholder[]>(RECETAS_MOCK);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Mis recetas</Text>
        <View style={styles.headerRight}>
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>{recetas.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={recetas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={recetas.length === 0 ? styles.centrado : styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyIcono}>
              <Ionicons name="book-outline" size={48} color={colors.secondary} />
            </View>
            <Text style={styles.emptyTitulo}>Aún no has publicado ninguna receta</Text>
            <Text style={styles.emptySubtitulo}>
              Tus recetas publicadas aparecerán aquí
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecetaCard
            titulo={item.titulo}
            tiempo={item.tiempo}
            dificultad={item.dificultad}
            gradiente={item.gradiente}
            vistas={item.vistas}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </SafeAreaView>
  );
}

function RecetaCard({
  titulo,
  tiempo,
  dificultad,
  gradiente,
  vistas,
}: {
  titulo: string;
  tiempo: number;
  dificultad: string;
  gradiente: [string, string];
  vistas: number;
}) {
  const dificultadColor: Record<string, string> = {
    Fácil: colors.primary,
    Media: colors.secondary,
    Difícil: colors.error,
  };

  return (
    <View style={cardStyles.container}>
      <LinearGradient colors={gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cardStyles.imagen}>
        <View style={cardStyles.imagenIcono}>
          <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.8)" />
        </View>
        <View style={[cardStyles.dificultadBadge, { backgroundColor: dificultadColor[dificultad] ?? colors.grayMid }]}>
          <Text style={cardStyles.dificultadTexto}>{dificultad}</Text>
        </View>
      </LinearGradient>
      <View style={cardStyles.cuerpo}>
        <Text style={cardStyles.titulo} numberOfLines={2}>{titulo}</Text>
        <View style={cardStyles.metaRow}>
          <View style={cardStyles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={cardStyles.metaTexto}>{tiempo} min</Text>
          </View>
          <View style={cardStyles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={colors.text.secondary} />
            <Text style={cardStyles.metaTexto}>{vistas} vistas</Text>
          </View>
        </View>
      </View>
    </View>
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
  headerRight: { width: 40, alignItems: 'flex-end' },
  contador: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  contadorTexto: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.white },
  lista: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyWrapper: { alignItems: 'center', gap: spacing.md },
  emptyIcono: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
  emptySubtitulo: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imagen: { height: 130, alignItems: 'center', justifyContent: 'center' },
  imagenIcono: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dificultadBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  dificultadTexto: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.white },
  cuerpo: { padding: spacing.lg, gap: spacing.sm },
  titulo: { ...typography.heading3, color: colors.text.primary },
  metaRow: { flexDirection: 'row', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaTexto: { ...typography.caption, color: colors.text.secondary },
});
