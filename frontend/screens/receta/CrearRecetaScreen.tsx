import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { EtiquetasSelector, FormRecetaBasica } from '@/components/receta';
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
}

const FORM_VACIO: FormBasico = {
  titulo: '',
  descripcion: '',
  tiempoEstimado: '',
  dificultad: '',
  categoria: '',
};

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

export function CrearRecetaScreen() {
  const router = useRouter();
  const { crearReceta, cargarMisBorradores, borradores, isLoading, error, clearError } = useRecetaStore();

  const [form, setForm] = useState<FormBasico>(FORM_VACIO);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarMisBorradores();
  }, []);

  const handleCambio = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: '' }));
  };

  const handleContinuar = async () => {
    clearError();
    const e = validarForm(form);
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return;
    }
    try {
      const nueva = await crearReceta({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        tiempoEstimado: parseInt(form.tiempoEstimado),
        dificultad: form.dificultad,
        categoria: form.categoria,
        etiquetas,
      });
      setForm(FORM_VACIO);
      setEtiquetas([]);
      router.push(`/receta/editar?id=${nueva.id}`);
    } catch {
      // error shown below
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcono}>
              <Ionicons name="restaurant-outline" size={32} color={colors.white} />
            </View>
            <Text style={styles.heroTitulo}>Nueva receta</Text>
            <Text style={styles.heroSubtitulo}>
              Empieza con los datos básicos. Añadirás ingredientes y pasos a continuación.
            </Text>
          </View>

          {/* Borradores pendientes */}
          {borradores.length > 0 && (
            <View style={styles.card}>
              <SeccionHeader icono="document-text-outline" titulo="Borradores pendientes" />
              {borradores.map((b) => (
                <Pressable
                  key={b.id}
                  style={styles.borradorItem}
                  onPress={() => router.push(`/receta/editar?id=${b.id}`)}
                >
                  <View style={styles.borradorIcono}>
                    <Ionicons name="document-outline" size={20} color={colors.grayDark} />
                  </View>
                  <View style={styles.borradorInfo}>
                    <Text style={styles.borradorTitulo} numberOfLines={1}>
                      {b.titulo || 'Sin título'}
                    </Text>
                    <Text style={styles.borradorCategoria}>
                      {b.categoria || 'Sin categoría'} · {b.tiempoEstimado > 0 ? `${b.tiempoEstimado} min` : 'Sin tiempo'}
                    </Text>
                  </View>
                  <View style={styles.borradorContinuar}>
                    <Text style={styles.borradorContinuarText}>Continuar</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Formulario básico */}
          <View style={styles.card}>
            <SeccionHeader icono="create-outline" titulo="Información básica" />
            <FormRecetaBasica
              titulo={form.titulo}
              descripcion={form.descripcion}
              tiempoEstimado={form.tiempoEstimado}
              dificultad={form.dificultad}
              categoria={form.categoria}
              onChange={handleCambio}
              errores={errores}
            />
          </View>

          {/* Etiquetas */}
          <View style={styles.card}>
            <SeccionHeader icono="pricetags-outline" titulo="Etiquetas" opcional />
            <EtiquetasSelector etiquetas={etiquetas} onChange={setEtiquetas} />
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.btnPrincipal, isLoading && styles.btnDisabled]}
            onPress={handleContinuar}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.btnPrincipalText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SeccionHeader({
  icono, titulo, opcional = false,
}: {
  icono: string; titulo: string; opcional?: boolean;
}) {
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
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  heroIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitulo: { ...typography.heading1, color: colors.white, textAlign: 'center' },
  heroSubtitulo: { ...typography.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  borradorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  borradorIcono: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borradorInfo: { flex: 1 },
  borradorTitulo: { ...typography.label, color: colors.text.primary },
  borradorCategoria: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  borradorContinuar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  borradorContinuarText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF0F0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { ...typography.body, color: colors.error, flex: 1 },
  btnPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    minHeight: 44,
    ...shadows.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrincipalText: { ...typography.button, color: colors.white },
});

const seccionStyles = StyleSheet.create({
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
  opcional: { ...typography.caption, color: colors.grayDark },
});
