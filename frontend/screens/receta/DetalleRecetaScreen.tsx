import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { IngredienteReceta, PasoReceta } from '@/services/recetaService';
import { useAuthStore } from '@/store/authStore';
import { useRecetaStore } from '@/store/recetaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const DIFICULTAD_COLOR: Record<string, string> = {
  Fácil: colors.primary,
  Media: colors.secondary,
  Difícil: colors.error,
};

export function DetalleRecetaScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const currentUserId = useAuthStore((s) => s.usuario?.userId);

  const receta = useRecetaStore((s) => s.recetaActual);
  const error = useRecetaStore((s) => s.error);
  const cargarReceta = useRecetaStore((s) => s.cargarReceta);
  const eliminarReceta = useRecetaStore((s) => s.eliminarReceta);
  const recetasGuardadas = useRecetaStore((s) => s.recetasGuardadas);
  const cargarRecetasGuardadas = useRecetaStore((s) => s.cargarRecetasGuardadas);
  const guardarReceta = useRecetaStore((s) => s.guardarReceta);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) return;
    cargarReceta(id).finally(() => setCargando(false));
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const esPropia = receta?.autorId === currentUserId;
  const estaGuardada = recetasGuardadas.some((r) => r.id === receta?.id);

  useEffect(() => {
    if (receta && !esPropia) cargarRecetasGuardadas();
  }, [receta?.id, esPropia]);

  const handleGuardar = async () => {
    if (!receta) return;
    setGuardando(true);
    try {
      await guardarReceta(receta.id);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la receta. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar receta',
      `¿Seguro que quieres eliminar "${receta?.titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarReceta(receta!.id);
              goBack();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la receta. Inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return <LoadingScreen />;
  }

  if (error || !receta) {
    return (
      <ErrorScreen
        titulo="No se pudo cargar la receta"
        descripcion={error ?? 'Receta no encontrada'}
        onVolver={goBack}
      />
    );
  }

  const pasosOrdenados = [...receta.pasos].sort((a, b) => a.orden - b.orden);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>
          {receta.titulo}
        </Text>
        {esPropia ? (
          <View style={styles.headerActions}>
            <Pressable
              testID="btn-editar-receta"
              onPress={() => router.push(`/receta/editar?id=${receta.id}`)}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable testID="btn-eliminar-receta" onPress={confirmarEliminar} hitSlop={8}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="btn-guardar-receta"
            style={[styles.guardarBtn, estaGuardada && styles.guardarBtnDisabled]}
            onPress={estaGuardada || guardando ? undefined : handleGuardar}
            disabled={estaGuardada || guardando}
          >
            <Ionicons
              name={estaGuardada ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={estaGuardada ? colors.grayMid : colors.primary}
            />
            <Text style={[styles.guardarBtnTexto, estaGuardada && styles.guardarBtnTextoDisabled]}>
              {estaGuardada ? 'Guardada' : 'Guardar receta'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero imagen */}
        {receta.imagenUrl ? (
          <Image
            source={{ uri: receta.imagenUrl }}
            style={styles.heroImagen}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <View style={styles.heroIconWrapper}>
              <Ionicons name="restaurant-outline" size={52} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        )}

        <View style={styles.content}>
          {/* Título y descripción */}
          <View style={styles.card}>
            <Text style={styles.titulo}>{receta.titulo}</Text>
            <Text style={styles.descripcion}>{receta.descripcion}</Text>

            {/* Meta chips */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color={colors.grayDark} />
                <Text style={styles.metaText}>{receta.tiempoEstimado} min</Text>
              </View>
              <View style={[styles.metaChip, { borderColor: DIFICULTAD_COLOR[receta.dificultad] ?? colors.grayMid }]}>
                <Ionicons
                  name="barbell-outline"
                  size={14}
                  color={DIFICULTAD_COLOR[receta.dificultad] ?? colors.grayDark}
                />
                <Text style={[styles.metaText, { color: DIFICULTAD_COLOR[receta.dificultad] ?? colors.text.secondary }]}>
                  {receta.dificultad}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="restaurant-outline" size={14} color={colors.grayDark} />
                <Text style={styles.metaText}>{receta.categoria}</Text>
              </View>
            </View>

            {/* Etiquetas */}
            {receta.etiquetas.length > 0 && (
              <View style={styles.etiquetasRow}>
                {receta.etiquetas.map((tag) => (
                  <View key={tag} style={styles.etiquetaChip}>
                    <Text style={styles.etiquetaText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Ingredientes */}
          <View style={styles.card}>
            <SectionHeader
              icon="nutrition-outline"
              titulo="Ingredientes"
              count={receta.ingredientes.length}
            />
            {receta.ingredientes.length === 0 ? (
              <Text style={styles.vaciText}>Sin ingredientes</Text>
            ) : (
              <View style={styles.ingredientesList}>
                {receta.ingredientes.map((ing) => (
                  <IngredienteRow key={ing.id} ingrediente={ing} />
                ))}
              </View>
            )}
          </View>

          {/* Pasos */}
          <View style={styles.card}>
            <SectionHeader
              icon="list-outline"
              titulo="Preparación"
              count={pasosOrdenados.length}
            />
            {pasosOrdenados.length === 0 ? (
              <Text style={styles.vaciText}>Sin pasos</Text>
            ) : (
              <View style={styles.pasosList}>
                {pasosOrdenados.map((paso) => (
                  <PasoCard key={paso.id} paso={paso} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  icon,
  titulo,
  count,
}: {
  icon: string;
  titulo: string;
  count: number;
}) {
  return (
    <View style={secStyles.header}>
      <View style={secStyles.icono}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={secStyles.titulo}>{titulo}</Text>
      <View style={secStyles.badge}>
        <Text style={secStyles.badgeText}>{count}</Text>
      </View>
    </View>
  );
}

function IngredienteRow({ ingrediente }: { ingrediente: IngredienteReceta }) {
  const cantidad = ingrediente.cantidad % 1 === 0
    ? String(ingrediente.cantidad)
    : ingrediente.cantidad.toFixed(1);

  return (
    <View style={ingStyles.row}>
      <View style={ingStyles.bullet} />
      <Text style={ingStyles.nombre}>{ingrediente.nombre}</Text>
      <Text style={ingStyles.cantidad}>
        {cantidad} {ingrediente.unidad}
      </Text>
      {ingrediente.observacion ? (
        <Text style={ingStyles.obs}>{ingrediente.observacion}</Text>
      ) : null}
    </View>
  );
}

function PasoCard({ paso }: { paso: PasoReceta }) {
  return (
    <View style={pasoStyles.card}>
      <View style={pasoStyles.numWrapper}>
        <Text style={pasoStyles.num}>{paso.orden}</Text>
      </View>
      <View style={pasoStyles.body}>
        <Text style={pasoStyles.descripcion}>{paso.descripcion}</Text>
        {paso.imagenUrl ? (
          <Image
            source={{ uri: paso.imagenUrl }}
            style={pasoStyles.imagen}
            resizeMode="cover"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerTitulo: { ...typography.heading3, color: colors.text.primary, flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  guardarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  guardarBtnDisabled: { backgroundColor: colors.grayLight },
  guardarBtnTexto: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  guardarBtnTextoDisabled: { color: colors.grayMid },

  scroll: { paddingBottom: spacing.xxxl },

  heroImagen: { width: '100%', height: 220 },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: spacing.lg, gap: spacing.lg },

  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },

  titulo: { ...typography.heading1, color: colors.text.primary },
  descripcion: { ...typography.body, color: colors.text.secondary, lineHeight: 22 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  metaText: { ...typography.caption, color: colors.text.secondary, fontWeight: '500' },

  etiquetasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  etiquetaChip: {
    backgroundColor: '#E8F5D0',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  etiquetaText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },

  vaciText: { ...typography.body, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.sm },

  ingredientesList: { gap: spacing.sm },
  pasosList: { gap: spacing.md },
});

const secStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icono: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...typography.heading3, color: colors.text.primary, flex: 1 },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.white, fontWeight: '700' },
});

const ingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  nombre: { ...typography.body, color: colors.text.primary, flex: 1 },
  cantidad: { ...typography.label, color: colors.text.secondary },
  obs: { ...typography.caption, color: colors.grayDark, fontStyle: 'italic' },
});

const pasoStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  numWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  num: { ...typography.label, color: colors.white, fontSize: 13 },
  body: { flex: 1, gap: spacing.sm },
  descripcion: { ...typography.body, color: colors.text.primary, lineHeight: 21 },
  imagen: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
});
