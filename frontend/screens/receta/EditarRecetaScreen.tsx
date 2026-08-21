import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import {
  EtiquetasSelector,
  FormIngrediente,
  FormPaso,
  FormRecetaBasica,
  ImagenReceta,
  ListaIngredientes,
  ListaPasos,
  ValidacionReceta,
} from '@/components/receta';
import { showConfirm } from '@/hooks/useConfirm';
import { IngredienteInput, PasoInput, recetaService } from '@/services/recetaService';
import { usePerfilStore } from '@/store/perfilStore';
import { resolveImagenUrl } from '@/utils/media';
import { useRecetaStore } from '@/store/recetaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface FormBasico {
  titulo: string;
  descripcion: string;
  tiempoEstimado: string;
  dificultad: string;
  categoria: string;
  numPersonas: string;
}

function validarForm(form: FormBasico): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.titulo.trim()) e.titulo = 'El título es obligatorio';
  if (!form.descripcion.trim()) e.descripcion = 'La descripción es obligatoria';
  const t = parseInt(form.tiempoEstimado);
  if (!form.tiempoEstimado || isNaN(t) || t <= 0) e.tiempoEstimado = 'Introduce un tiempo válido';
  if (!form.dificultad) e.dificultad = 'Selecciona una dificultad';
  if (!form.categoria) e.categoria = 'Selecciona una categoría';
  return e;
}

export function EditarRecetaScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const {
    recetaActual, cargarReceta, editarReceta, publicarReceta,
    actualizarImagen, actualizarEtiquetas, añadirIngrediente,
    eliminarIngrediente, añadirPaso, eliminarPaso, reordenarPasos,
    isLoading, error, clearError,
  } = useRecetaStore();

  const [form, setForm] = useState<FormBasico>({
    titulo: '', descripcion: '', tiempoEstimado: '', dificultad: '', categoria: '', numPersonas: '2',
  });
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);
  const [autoGuardando, setAutoGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (id) cargarReceta(id);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [id]);

  useEffect(() => {
    if (recetaActual) {
      setForm({
        titulo: recetaActual.titulo,
        descripcion: recetaActual.descripcion,
        tiempoEstimado: String(recetaActual.tiempoEstimado),
        dificultad: recetaActual.dificultad,
        categoria: recetaActual.categoria,
        numPersonas: String(recetaActual.numPersonas ?? 2),
      });
      setEtiquetas(recetaActual.etiquetas ?? []);
    }
  }, [recetaActual?.id]);

  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmarSalida();
      return true;
    });
    return () => sub.remove();
  }, [recetaActual]);

  const completitud = useMemo(() => {
    if (!recetaActual) return 0;
    const checks = [
      !!recetaActual.titulo, !!recetaActual.descripcion,
      recetaActual.tiempoEstimado > 0, !!recetaActual.dificultad,
      !!recetaActual.categoria, recetaActual.ingredientes.length > 0,
      recetaActual.pasos.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [recetaActual]);

  const programarAutoGuardado = (nuevoForm: FormBasico) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!id || !nuevoForm.titulo.trim()) return;
      const tiempo = parseInt(nuevoForm.tiempoEstimado);
      setAutoGuardando(true);
      try {
        const actualizada = await recetaService.editarReceta(id, {
          titulo: nuevoForm.titulo.trim(),
          descripcion: nuevoForm.descripcion.trim(),
          tiempoEstimado: isNaN(tiempo) ? 0 : tiempo,
          dificultad: nuevoForm.dificultad,
          categoria: nuevoForm.categoria,
          numPersonas: parseInt(nuevoForm.numPersonas) || 2,
          etiquetas: recetaActual?.etiquetas ?? [],
        });
        useRecetaStore.setState({ recetaActual: actualizada });
        setUltimoGuardado(new Date());
      } catch { /* silencioso */ } finally {
        setAutoGuardando(false);
      }
    }, 2000);
  };

  const handleCambio = (campo: string, valor: string) => {
    const nuevoForm = { ...form, [campo]: valor };
    setForm(nuevoForm);
    setErroresForm((prev) => ({ ...prev, [campo]: '' }));
    programarAutoGuardado(nuevoForm);
  };

  const handleGuardarBasicos = async () => {
    clearError();
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const e = validarForm(form);
    if (Object.keys(e).length > 0) { setErroresForm(e); return; }
    try {
      await editarReceta(id, {
        titulo: form.titulo.trim(), descripcion: form.descripcion.trim(),
        tiempoEstimado: parseInt(form.tiempoEstimado),
        dificultad: form.dificultad, categoria: form.categoria,
        numPersonas: parseInt(form.numPersonas) || 2,
        etiquetas: recetaActual?.etiquetas ?? [],
      });
      setUltimoGuardado(new Date());
    } catch { /* error en store */ }
  };

  const handleGuardarEtiquetas = async () => {
    clearError();
    try { await actualizarEtiquetas(id, etiquetas); } catch { /* error en store */ }
  };

  const esPublicada = recetaActual?.estado === 'publicada';

  const handlePublicar = async () => {
    clearError();
    setErrorPublicar(null);
    try {
      await publicarReceta(id);
      usePerfilStore.getState().cargarEstadisticas();
      router.replace('/(tabs)');
    } catch (e) {
      setErrorPublicar(e instanceof Error ? e.message : 'Error al publicar');
    }
  };

  const handleConfirmarCambios = async () => {
    clearError();
    setErrorPublicar(null);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const e = validarForm(form);
    if (Object.keys(e).length > 0) { setErroresForm(e); return; }
    try {
      await editarReceta(id, {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        tiempoEstimado: parseInt(form.tiempoEstimado),
        dificultad: form.dificultad,
        categoria: form.categoria,
        numPersonas: parseInt(form.numPersonas) || 2,
        etiquetas: recetaActual?.etiquetas ?? [],
      });
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch { /* error en store */ }
  };

  const confirmarSalida = () => {
    if (esPublicada) {
      showConfirm(
        '¿Salir de la edición?',
        'Los cambios no guardados se perderán.',
        [
          { text: 'Seguir editando', style: 'cancel' },
          {
            text: 'Salir sin guardar',
            onPress: () => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            },
          },
        ],
        { icon: 'help-circle-outline' }
      );
    } else {
      showConfirm(
        '¿Salir de la receta?',
        'La receta quedará guardada como borrador y podrás continuarla más tarde desde la pestaña Crear.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Guardar borrador',
            onPress: () => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            },
          },
          {
            text: 'Eliminar borrador',
            style: 'destructive',
            onPress: async () => {
              if (recetaActual) {
                try { await recetaService.eliminarReceta(recetaActual.id); } catch {}
                useRecetaStore.getState().reset();
              }
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            },
          },
        ],
        { icon: 'help-circle-outline' }
      );
    }
  };

  if (!recetaActual && isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LoadingOverlay visible={isLoading && !!recetaActual} />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={confirmarSalida} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitulo} numberOfLines={1}>
            {recetaActual?.titulo || 'Editar receta'}
          </Text>
          {autoGuardando && <Text style={styles.autoText}>Guardando...</Text>}
          {!autoGuardando && ultimoGuardado && (
            <Text style={styles.autoText}>
              Guardado · {ultimoGuardado.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <View style={[styles.badgeBorrador, esPublicada && styles.badgePublicada]}>
          <Text style={[styles.badgeText, esPublicada && styles.badgeTextPublicada]}>
            {esPublicada ? 'Publicada' : 'Borrador'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progreso */}
          <View style={styles.card}>
            <View style={styles.progresoHeader}>
              <Text style={styles.progresoLabel}>Completitud</Text>
              <Text style={styles.progresoPct}>{completitud}%</Text>
            </View>
            <View style={styles.progresoBar}>
              <View style={[styles.progresoFill, { width: `${completitud}%` as any }]} />
            </View>
            {completitud < 100 && (
              <Text style={styles.progresoHint}>
                Faltan: {[
                  !recetaActual?.titulo && 'título',
                  !recetaActual?.descripcion && 'descripción',
                  !recetaActual?.tiempoEstimado && 'tiempo',
                  !recetaActual?.dificultad && 'dificultad',
                  !recetaActual?.categoria && 'categoría',
                  !(recetaActual?.ingredientes.length) && 'ingredientes',
                  !(recetaActual?.pasos.length) && 'pasos',
                ].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>

          {error && !errorPublicar && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Datos básicos */}
          <View style={styles.card}>
            <SeccionHeader icono="create-outline" titulo="Datos básicos" />
            <FormRecetaBasica
              titulo={form.titulo} descripcion={form.descripcion}
              tiempoEstimado={form.tiempoEstimado} dificultad={form.dificultad}
              categoria={form.categoria} numPersonas={form.numPersonas}
              onChange={handleCambio} errores={erroresForm}
            />
            <Pressable
              style={[styles.btnSeccion, isLoading && styles.btnDisabled]}
              onPress={handleGuardarBasicos} disabled={isLoading}
            >
              <Text style={styles.btnSeccionText}>Guardar datos básicos</Text>
            </Pressable>
          </View>

          {/* Imagen */}
          <View style={styles.card}>
            <SeccionHeader icono="image-outline" titulo="Imagen de portada" opcional />
            <ImagenReceta
              imagenUrl={resolveImagenUrl(recetaActual?.imagenUrl)}
              onActualizar={(url) => actualizarImagen(id, url)}
              isLoading={isLoading}
            />
          </View>

          {/* Etiquetas */}
          <View style={styles.card}>
            <SeccionHeader icono="pricetags-outline" titulo="Etiquetas" opcional />
            <EtiquetasSelector etiquetas={etiquetas} onChange={setEtiquetas} />
            <Pressable
              style={[styles.btnSeccion, isLoading && styles.btnDisabled]}
              onPress={handleGuardarEtiquetas} disabled={isLoading}
            >
              <Text style={styles.btnSeccionText}>Guardar etiquetas</Text>
            </Pressable>
          </View>

          {/* Ingredientes */}
          <View style={styles.card}>
            <SeccionHeader icono="nutrition-outline" titulo="Ingredientes" />
            <ListaIngredientes
              ingredientes={recetaActual?.ingredientes ?? []}
              onEliminar={(ingId) => eliminarIngrediente(id, ingId)}
              isLoading={isLoading}
            />
            <View style={styles.sep} />
            <Text style={styles.subLabel}>Añadir ingrediente</Text>
            <FormIngrediente
              onGuardar={(datos: IngredienteInput) => añadirIngrediente(id, datos)}
              isLoading={isLoading}
            />
          </View>

          {/* Pasos */}
          <View style={styles.card}>
            <SeccionHeader icono="list-outline" titulo="Pasos" />
            <ListaPasos
              pasos={recetaActual?.pasos ?? []}
              onEliminar={(pasoId) => eliminarPaso(id, pasoId)}
              onReordenar={(ordenIds) => reordenarPasos(id, ordenIds)}
              isLoading={isLoading}
            />
            <View style={styles.sep} />
            <Text style={styles.subLabel}>Añadir paso</Text>
            <FormPaso
              onGuardar={(datos: PasoInput) => añadirPaso(id, datos)}
              isLoading={isLoading}
            />
          </View>

          {/* Video — próximamente (al final para no tapar teclado) */}
          <View style={[styles.card, styles.cardProx]}>
            <View style={styles.proxRow}>
              <View style={styles.proxIcono}>
                <Ionicons name="videocam-outline" size={22} color={colors.grayDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.proxTitulo}>Video de preparación</Text>
                <Text style={styles.proxDesc}>Pronto podrás adjuntar un vídeo de tu receta.</Text>
              </View>
              <View style={styles.proxBadge}>
                <Text style={styles.proxBadgeText}>Próximamente</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA fijo abajo */}
      <View style={styles.bottomBar}>
        <ValidacionReceta mensaje={errorPublicar} />
        {esPublicada ? (
          <Pressable
            style={[styles.btnPublicar, isLoading && styles.btnPublicarMuted]}
            onPress={handleConfirmarCambios}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={20} color={colors.white} />
                <Text style={styles.btnPublicarText}>Confirmar cambios</Text>
              </>
            )}
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.btnPublicar, (isLoading || completitud < 100) && styles.btnPublicarMuted]}
              onPress={handlePublicar}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                  <Text style={styles.btnPublicarText}>Publicar receta</Text>
                </>
              )}
            </Pressable>
            {completitud < 100 && (
              <Text style={styles.btnPublicarHint}>
                Completa el formulario al 100% para publicar
              </Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function SeccionHeader({ icono, titulo, opcional = false }: { icono: string; titulo: string; opcional?: boolean }) {
  return (
    <View style={seccionStyles.header}>
      <View style={seccionStyles.icono}>
        <Ionicons name={icono as any} size={18} color={colors.primary} />
      </View>
      <Text style={seccionStyles.titulo}>{titulo}</Text>
      {opcional && <Text style={seccionStyles.opcional}>Opcional</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  flex: { flex: 1 },
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  cargandoText: { ...typography.body, color: colors.text.secondary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1 },
  headerTitulo: { ...typography.heading3, color: colors.text.primary },
  autoText: { ...typography.caption, color: colors.grayDark, marginTop: 1 },
  badgeBorrador: {
    backgroundColor: colors.grayLight, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  badgePublicada: { backgroundColor: '#E8F5D0' },
  badgeText: { ...typography.caption, color: colors.grayDark, fontWeight: '600' },
  badgeTextPublicada: { color: colors.primaryDark },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.lg, gap: spacing.md, ...shadows.sm,
  },
  cardProx: { opacity: 0.7 },
  proxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  proxIcono: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    backgroundColor: colors.grayLight, alignItems: 'center', justifyContent: 'center',
  },
  proxTitulo: { ...typography.label, color: colors.text.primary },
  proxDesc: { ...typography.caption, color: colors.text.secondary },
  proxBadge: {
    backgroundColor: '#FFF8E1', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  proxBadgeText: { ...typography.caption, color: colors.secondary, fontWeight: '600' },
  progresoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progresoLabel: { ...typography.label, color: colors.text.primary },
  progresoPct: { ...typography.label, color: colors.primary },
  progresoBar: {
    height: 8, backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full, overflow: 'hidden',
  },
  progresoFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
  progresoHint: { ...typography.caption, color: colors.text.secondary },
  sep: { height: 1, backgroundColor: colors.grayLight },
  subLabel: { ...typography.label, color: colors.text.secondary },
  btnSeccion: {
    backgroundColor: '#E8F5D0', borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, alignItems: 'center', minHeight: 44,
    justifyContent: 'center',
  },
  btnSeccionText: { ...typography.label, color: colors.primaryDark },
  btnDisabled: { opacity: 0.5 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FFF0F0', borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorText: { ...typography.body, color: colors.error, flex: 1 },
  bottomBar: {
    backgroundColor: colors.white, paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, paddingBottom: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.gray, gap: spacing.sm,
    ...shadows.lg,
  },
  btnPublicar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    borderRadius: borderRadius.xl, paddingVertical: spacing.md,
  },
  btnPublicarMuted: { opacity: 0.6 },
  btnPublicarText: { ...typography.button, color: colors.white },
  btnPublicarHint: { ...typography.caption, color: colors.text.secondary, textAlign: 'center' },
});

const seccionStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icono: {
    width: 32, height: 32, borderRadius: borderRadius.sm,
    backgroundColor: '#E8F5D0', alignItems: 'center', justifyContent: 'center',
  },
  titulo: { ...typography.heading3, color: colors.text.primary, flex: 1 },
  opcional: { ...typography.caption, color: colors.grayDark },
});
