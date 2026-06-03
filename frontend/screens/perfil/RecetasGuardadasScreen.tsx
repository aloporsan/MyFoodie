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
  autor: string;
  gradiente: [string, string];
}

const RECETAS_MOCK: RecetaPlaceholder[] = [
  {
    id: '1',
    titulo: 'Pasta carbonara',
    tiempo: 30,
    dificultad: 'Fácil',
    autor: 'chef_mario',
    gradiente: ['#FF6B6B', '#FF8E53'],
  },
  {
    id: '2',
    titulo: 'Pollo al horno con verduras',
    tiempo: 60,
    dificultad: 'Media',
    autor: 'cocina_saludable',
    gradiente: ['#4ECDC4', '#2ECC71'],
  },
  {
    id: '3',
    titulo: 'Gazpacho andaluz',
    tiempo: 15,
    dificultad: 'Fácil',
    autor: 'recetas_del_sur',
    gradiente: ['#F8B133', '#F4A000'],
  },
  {
    id: '4',
    titulo: 'Risotto de champiñones',
    tiempo: 45,
    dificultad: 'Media',
    autor: 'italia_en_casa',
    gradiente: ['#a18cd1', '#fbc2eb'],
  },
];

export function RecetasGuardadasScreen() {
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
        <Text style={styles.headerTitulo}>Recetas guardadas</Text>
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
            tintColor={'#F8B133'}
            colors={['#F8B133']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyIcono}>
              <Ionicons name="bookmark-outline" size={48} color={'#F8B133'} />
            </View>
            <Text style={styles.emptyTitulo}>Aún no tienes recetas guardadas</Text>
            <Text style={styles.emptySubtitulo}>
              Cuando guardes una receta aparecerá aquí
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecetaCard
            titulo={item.titulo}
            tiempo={item.tiempo}
            dificultad={item.dificultad}
            gradiente={item.gradiente}
            info={`Por @${item.autor}`}
            infoIcono="person-outline"
            accentColor={'#F8B133'}
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
  info,
  infoIcono,
  accentColor,
}: {
  titulo: string;
  tiempo: number;
  dificultad: string;
  gradiente: [string, string];
  info: string;
  infoIcono: React.ComponentProps<typeof Ionicons>['name'];
  accentColor: string;
}) {
  return (
    <View style={cardStyles.container}>
      <LinearGradient colors={gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cardStyles.imagen}>
        <View style={cardStyles.imagenIcono}>
          <Ionicons name="restaurant-outline" size={36} color="rgba(255,255,255,0.8)" />
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
            <Ionicons name="bar-chart-outline" size={14} color={colors.text.secondary} />
            <Text style={cardStyles.metaTexto}>{dificultad}</Text>
          </View>
        </View>
        <View style={cardStyles.footerRow}>
          <Ionicons name={infoIcono} size={13} color={accentColor} />
          <Text style={[cardStyles.footerTexto, { color: accentColor }]}>{info}</Text>
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
    backgroundColor: '#F8B133',
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
    backgroundColor: '#F8B13320',
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
  cuerpo: { padding: spacing.lg, gap: spacing.sm },
  titulo: { ...typography.heading3, color: colors.text.primary },
  metaRow: { flexDirection: 'row', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaTexto: { ...typography.caption, color: colors.text.secondary },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  footerTexto: { ...typography.caption, fontFamily: 'Poppins_600SemiBold' },
});
