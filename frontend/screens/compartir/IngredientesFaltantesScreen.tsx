import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useToast } from '@/hooks/useToast';
import type { IngredienteReceta } from '@/services/recetaService';
import { useCarritoStore } from '@/store/carritoStore';
import { useCompartirStore } from '@/store/compartirStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { resolveImagenUrl } from '@/utils/media';
import { unidadDeCompra } from '@/utils/unidadConfig';

const DIFICULTAD_COLOR: Record<string, string> = {
  'fácil': colors.primary,
  media: colors.secondary,
  'difícil': colors.error,
};

export function IngredientesFaltantesScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const recetasRecibidas = useCompartirStore((s) => s.recetasRecibidas);
  const ingredientesFaltantes = useCompartirStore((s) => s.ingredientesFaltantes);
  const isLoading = useCompartirStore((s) => s.isLoading);
  const cargarIngredientesFaltantes = useCompartirStore((s) => s.cargarIngredientesFaltantes);
  const añadirYAceptarItemManual = useCarritoStore((s) => s.añadirYAceptarItemManual);

  const recetaCompartida = recetasRecibidas.find((r) => r.id === id);

  useEffect(() => {
    if (id) cargarIngredientesFaltantes(id);
  }, [id]);

  const { disponibles, faltantes } = useMemo(() => {
    if (!recetaCompartida) return { disponibles: [] as IngredienteReceta[], faltantes: [] as IngredienteReceta[] };
    const nombresFaltantes = new Set(ingredientesFaltantes.map((i) => i.nombre.trim().toLowerCase()));
    const disponibles: IngredienteReceta[] = [];
    const faltantes: IngredienteReceta[] = [];
    for (const ingrediente of recetaCompartida.receta.ingredientes) {
      if (nombresFaltantes.has(ingrediente.nombre.trim().toLowerCase())) {
        faltantes.push(ingrediente);
      } else {
        disponibles.push(ingrediente);
      }
    }
    return { disponibles, faltantes };
  }, [recetaCompartida, ingredientesFaltantes]);

  const [añadiendoCarrito, setAñadiendoCarrito] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/compartir/recibidas'));

  const handleAñadirAlCarrito = async () => {
    setAñadiendoCarrito(true);
    try {
      for (const ingrediente of faltantes) {
        const compra = unidadDeCompra(ingrediente.cantidad, ingrediente.unidad);
        await añadirYAceptarItemManual({
          nombre: ingrediente.nombre,
          cantidad: compra?.cantidad ?? ingrediente.cantidad,
          unidad: compra?.unidad ?? ingrediente.unidad,
        });
      }
      showSuccess(
        `${faltantes.length} ingrediente${faltantes.length !== 1 ? 's' : ''} añadido${faltantes.length !== 1 ? 's' : ''} al carrito`
      );
    } catch {
      showError('No se pudieron añadir los ingredientes al carrito');
    } finally {
      setAñadiendoCarrito(false);
    }
  };

  if (isLoading && !recetaCompartida) {
    return <LoadingScreen />;
  }

  if (!recetaCompartida) {
    return (
      <ErrorScreen
        titulo="No se pudo cargar la receta"
        descripcion="Receta compartida no encontrada"
        onVolver={goBack}
      />
    );
  }

  const { receta, emisor, mensaje } = recetaCompartida;
  const pasosOrdenados = [...receta.pasos].sort((a, b) => a.orden - b.orden);
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad?.toLowerCase()] ?? colors.grayMid;
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>
          {receta.titulo}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {imagenUrl ? (
          <Image source={{ uri: imagenUrl }} style={styles.heroImagen} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="restaurant-outline" size={52} color="rgba(255,255,255,0.7)" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.compartidaPor}>
              Compartida por @{emisor.nombreUsuario}
            </Text>
            {mensaje && <Text style={styles.mensaje}>&quot;{mensaje}&quot;</Text>}

            <Text style={styles.titulo}>{receta.titulo}</Text>
            <Text style={styles.descripcion}>{receta.descripcion}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color={colors.grayDark} />
                <Text style={styles.metaText}>{receta.tiempoEstimado} min</Text>
              </View>
              <View style={[styles.metaChip, { borderColor: dificultadColor }]}>
                <Ionicons name="barbell-outline" size={14} color={dificultadColor} />
                <Text style={[styles.metaText, { color: dificultadColor }]}>{receta.dificultad}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader
              icon="checkmark-circle"
              iconColor={colors.primary}
              titulo="Ingredientes en tu despensa"
              count={disponibles.length}
            />
            {disponibles.length === 0 ? (
              <Text style={styles.vacioText}>No tienes ninguno de estos ingredientes</Text>
            ) : (
              <View style={styles.ingredientesList}>
                {disponibles.map((ing) => (
                  <IngredienteRow key={ing.id} ingrediente={ing} icono="checkmark-circle" color={colors.primary} />
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <SectionHeader
              icon="close-circle"
              iconColor={colors.error}
              titulo="Ingredientes que te faltan"
              count={faltantes.length}
            />
            {faltantes.length === 0 ? (
              <Text style={styles.vacioText}>¡Tienes todo lo que necesitas!</Text>
            ) : (
              <>
                <View style={styles.ingredientesList}>
                  {faltantes.map((ing) => (
                    <IngredienteRow key={ing.id} ingrediente={ing} icono="close-circle" color={colors.error} />
                  ))}
                </View>
                <Pressable
                  style={[styles.carritoBtn, añadiendoCarrito && styles.carritoBtnPresionado]}
                  onPress={handleAñadirAlCarrito}
                  disabled={añadiendoCarrito}
                  testID="btn-añadir-carrito"
                >
                  {añadiendoCarrito ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="cart-outline" size={18} color={colors.white} />
                      <Text style={styles.carritoBtnTexto}>Añadir faltantes al carrito</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>

          {pasosOrdenados.length > 0 && (
            <View style={styles.card}>
              <SectionHeader
                icon="list-outline"
                iconColor={colors.primary}
                titulo="Preparación"
                count={pasosOrdenados.length}
              />
              <View style={styles.pasosList}>
                {pasosOrdenados.map((paso) => (
                  <View key={paso.id} style={pasoStyles.card}>
                    <View style={pasoStyles.numWrapper}>
                      <Text style={pasoStyles.num}>{paso.orden}</Text>
                    </View>
                    <Text style={pasoStyles.descripcion}>{paso.descripcion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCantidad(cantidad: number) {
  return cantidad % 1 === 0 ? String(cantidad) : cantidad.toFixed(1);
}

function IngredienteRow({
  ingrediente,
  icono,
  color,
}: {
  ingrediente: IngredienteReceta;
  icono: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={ingStyles.row}>
      <Ionicons name={icono} size={16} color={color} />
      <Text style={ingStyles.nombre}>{ingrediente.nombre}</Text>
      <Text style={ingStyles.cantidad}>
        {formatCantidad(ingrediente.cantidad)} {ingrediente.unidad}
      </Text>
    </View>
  );
}

function SectionHeader({
  icon,
  iconColor,
  titulo,
  count,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  titulo: string;
  count: number;
}) {
  return (
    <View style={secStyles.header}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={secStyles.titulo}>{titulo}</Text>
      <View style={secStyles.badge}>
        <Text style={secStyles.badgeText}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },

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

  scroll: { paddingBottom: spacing.xxxl },

  heroImagen: { width: '100%', height: 220 },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: colors.primary,
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

  compartidaPor: { ...typography.caption, color: colors.text.secondary },
  mensaje: { ...typography.body, color: colors.text.secondary, fontStyle: 'italic' },

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

  vacioText: { ...typography.body, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.sm },

  ingredientesList: { gap: spacing.sm },

  carritoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  carritoBtnPresionado: { backgroundColor: '#C98400' },
  carritoBtnTexto: { ...typography.button, color: colors.white },

  pasosList: { gap: spacing.md },
});

const secStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  nombre: { ...typography.body, color: colors.text.primary, flex: 1 },
  cantidad: { ...typography.label, color: colors.text.secondary },
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
  descripcion: { ...typography.body, color: colors.text.primary, lineHeight: 21, flex: 1 },
});
