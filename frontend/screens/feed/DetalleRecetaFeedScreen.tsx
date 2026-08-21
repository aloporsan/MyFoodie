import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModalCompartir } from '@/components/compartir/ModalCompartir';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useToast } from '@/hooks/useToast';
import { despensaService } from '@/services/despensaService';
import { feedService } from '@/services/feedService';
import { pdfService } from '@/services/pdfService';
import { IngredienteReceta, Receta } from '@/services/recetaService';
import { useCarritoStore } from '@/store/carritoStore';
import { useFeedStore } from '@/store/feedStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { resolveImagenUrl } from '@/utils/media';
import { unidadDeCompra } from '@/utils/unidadConfig';

const DIFICULTAD_COLOR: Record<string, string> = {
  'fácil': colors.primary,
  media: colors.secondary,
  'difícil': colors.error,
};

export function DetalleRecetaFeedScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const recetas = useFeedStore((s) => s.recetas);
  const darLike = useFeedStore((s) => s.darLike);
  const quitarLike = useFeedStore((s) => s.quitarLike);
  const guardarReceta = useFeedStore((s) => s.guardarReceta);
  const añadirYAceptarItemManual = useCarritoStore((s) => s.añadirYAceptarItemManual);

  const recetaFeed = recetas.find((r) => r.id === id);

  const [receta, setReceta] = useState<Receta | null>(null);
  const [nombresDespensa, setNombresDespensa] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalCompartirVisible, setModalCompartirVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;

    setCargando(true);
    Promise.all([feedService.obtenerDetalle(id), despensaService.listarProductos()])
      .then(([detalle, productos]) => {
        if (cancelado) return;
        setReceta(detalle);
        setNombresDespensa(new Set(productos.map((p) => p.nombre.trim().toLowerCase())));
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar la receta');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  const { disponibles, faltantes } = useMemo(() => {
    if (!receta) return { disponibles: [] as IngredienteReceta[], faltantes: [] as IngredienteReceta[] };
    const disponibles: IngredienteReceta[] = [];
    const faltantes: IngredienteReceta[] = [];
    for (const ingrediente of receta.ingredientes) {
      if (nombresDespensa.has(ingrediente.nombre.trim().toLowerCase())) {
        disponibles.push(ingrediente);
      } else {
        faltantes.push(ingrediente);
      }
    }
    return { disponibles, faltantes };
  }, [receta, nombresDespensa]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));

  const handleLike = async () => {
    if (!id) return;
    try {
      if (recetaFeed?.yaLike) {
        await quitarLike(id);
      } else {
        await darLike(id);
      }
    } catch {
      showError('No se pudo actualizar el like');
    }
  };

  const handleGuardar = async () => {
    if (!id || recetaFeed?.yaGuardada) return;
    try {
      await guardarReceta(id);
      showSuccess('Receta guardada');
    } catch {
      showError('No se pudo guardar la receta');
    }
  };

  const [añadiendoCarrito, setAñadiendoCarrito] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const handleExportarPDF = async () => {
    if (!receta) return;
    setExportandoPdf(true);
    try {
      const uri = await pdfService.generarPDFReceta(receta);
      await pdfService.compartirPDF(uri, `${receta.titulo}.pdf`);
    } catch {
      showError('No se pudo exportar la receta a PDF');
    } finally {
      setExportandoPdf(false);
    }
  };

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
  const dificultadColor = DIFICULTAD_COLOR[receta.dificultad?.toLowerCase()] ?? colors.grayMid;
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={exportandoPdf} mensaje="Generando PDF..." />
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>
          {receta.titulo}
        </Text>
        <View style={styles.headerActions}>
          <Pressable testID="btn-exportar-pdf" onPress={handleExportarPDF} hitSlop={8}>
            <Ionicons name="document-text-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Pressable testID="btn-compartir-header" onPress={() => setModalCompartirVisible(true)} hitSlop={8}>
            <Ionicons name="share-social-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Pressable testID="btn-like-header" onPress={handleLike} hitSlop={8}>
            <Ionicons
              name={recetaFeed?.yaLike ? 'heart' : 'heart-outline'}
              size={22}
              color={recetaFeed?.yaLike ? colors.error : colors.text.primary}
            />
          </Pressable>
          <Pressable testID="btn-guardar-header" onPress={handleGuardar} hitSlop={8}>
            <Ionicons
              name={recetaFeed?.yaGuardada ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={recetaFeed?.yaGuardada ? colors.primary : colors.text.primary}
            />
          </Pressable>
        </View>
      </View>

      <ModalCompartir
        visible={modalCompartirVisible}
        recetaId={receta.id}
        onClose={() => setModalCompartirVisible(false)}
      />

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
              <View style={styles.metaChip}>
                <Ionicons name="heart-outline" size={14} color={colors.grayDark} />
                <Text style={styles.metaText}>{recetaFeed?.likes ?? receta.totalLikes ?? 0}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={14} color={colors.grayDark} />
                <Text style={styles.metaText}>Para {receta.numPersonas} personas</Text>
              </View>
            </View>

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

          <View style={styles.card}>
            <SectionHeader icon="chatbubble-outline" iconColor={colors.grayDark} titulo="Comentarios" count={0} />
            <View style={styles.comentariosPlaceholder}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.grayMid} />
              <Text style={styles.vacioText}>Los comentarios estarán disponibles próximamente</Text>
            </View>
          </View>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

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

  comentariosPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
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
