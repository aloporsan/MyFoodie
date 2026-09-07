import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EstadisticaItem } from '@/components/perfil/EstadisticaItem';
import { usePerfilStore } from '@/store/perfilStore';
import { useDespensaStore } from '@/store/despensaStore';
import { showConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import type { EstadisticasPerfil, MotivosEliminacion } from '@/services/perfilService';

type NivelInfo = {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  nombre: string;
  color: string;
  descripcion: string;
};

function getNivel(totalProductos: number): NivelInfo {
  if (totalProductos >= 250) return { icono: 'trophy-outline', nombre: 'Maestro', color: '#F8B133', descripcion: 'Más de 250 productos registrados' };
  if (totalProductos >= 100) return { icono: 'star-outline', nombre: 'Chef', color: colors.secondary, descripcion: 'Más de 100 productos registrados' };
  if (totalProductos >= 25) return { icono: 'flame-outline', nombre: 'Cocinero', color: colors.primary, descripcion: 'Más de 25 productos registrados' };
  return { icono: 'leaf-outline', nombre: 'Principiante', color: colors.primaryDark, descripcion: 'Empieza registrando productos' };
}

function calcularEficiencia(stats: EstadisticasPerfil): number | null {
  const m = stats.motivosEliminacion;
  if (m) {
    const bienUsados = m.consumido + m.usado_en_receta + m.donado;
    const desperdiciados = m.caducado + m.perdido;
    const total = bienUsados + desperdiciados;
    if (total === 0) return null;
    return Math.round((bienUsados / total) * 100);
  }
  if (stats.totalProductosRegistrados === 0) return null;
  return Math.round((stats.totalProductosConsumidos / stats.totalProductosRegistrados) * 100);
}

export function EstadisticasScreen() {
  const router = useRouter();
  const { estadisticas, isLoading, cargarEstadisticas } = usePerfilStore();
  const { vaciarDespensa } = useDespensaStore();
  const toast = useToast();

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const confirmarVaciarDespensa = async () => {
    try {
      const eliminados = await vaciarDespensa();
      await cargarEstadisticas();
      toast.showSuccess(
        eliminados > 0
          ? `Despensa vaciada: ${eliminados} producto${eliminados === 1 ? '' : 's'} eliminado${eliminados === 1 ? '' : 's'}`
          : 'Tu despensa ya estaba vacía',
      );
    } catch {
      toast.showError('No se pudo vaciar la despensa. Inténtalo de nuevo.');
    }
  };

  const handleVaciarDespensa = () => {
    showConfirm(
      'Vaciar despensa',
      'Se eliminarán todos los productos y sus lotes de tu despensa. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            showConfirm(
              '¿Estás completamente seguro?',
              'Perderás todo el contenido de tu despensa. Tu historial y tus estadísticas se conservan.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar definitivamente', style: 'destructive', onPress: confirmarVaciarDespensa },
              ],
              { icon: 'warning-outline' },
            );
          },
        },
      ],
      { icon: 'trash-outline' },
    );
  };

  const diasMiembro = estadisticas?.diasEnMyFoodie ?? 0;

  const nivel = getNivel(estadisticas?.totalProductosRegistrados ?? 0);
  const eficiencia = estadisticas ? calcularEficiencia(estadisticas) : null;
  const motivos = estadisticas?.motivosEliminacion;
  const bienUsados = motivos
    ? motivos.consumido + motivos.usado_en_receta + motivos.donado
    : (estadisticas?.totalProductosConsumidos ?? 0);
  const desperdiciados = motivos
    ? motivos.caducado + motivos.perdido
    : (estadisticas?.totalProductosCaducados ?? 0);
  const totalResueltos =
    (estadisticas?.totalProductosConsumidos ?? 0) + (estadisticas?.totalProductosCaducados ?? 0);
  const pendientes = Math.max(
    0,
    (estadisticas?.totalProductosRegistrados ?? 0) - totalResueltos,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading && !estadisticas} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      {estadisticas ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero card */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroAnillo}>
                <Text style={styles.heroPorcentaje}>
                  {eficiencia !== null ? `${eficiencia}` : '--'}
                </Text>
                {eficiencia !== null && <Text style={styles.heroPct}>%</Text>}
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroLabel}>Eficiencia alimentaria</Text>
                <View style={styles.nivelBadge}>
                  <Ionicons name={nivel.icono} size={16} color={colors.white} />
                  <Text style={styles.nivelNombre}>{nivel.nombre}</Text>
                </View>
                <Text style={styles.heroSub}>
                  {bienUsados} bien usados · {desperdiciados} desperdiciados
                </Text>
              </View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressTrack}>
              {bienUsados > 0 || desperdiciados > 0 ? (
                <>
                  {bienUsados > 0 && (
                    <View style={[styles.progressSeg, {
                      flex: bienUsados,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }]} />
                  )}
                  {desperdiciados > 0 && (
                    <View style={[styles.progressSeg, {
                      flex: desperdiciados,
                      backgroundColor: 'rgba(239,68,68,0.8)',
                    }]} />
                  )}
                </>
              ) : (
                <View style={[styles.progressSeg, { flex: 1, backgroundColor: 'rgba(255,255,255,0.25)' }]} />
              )}
            </View>
            <View style={styles.progressLeyenda}>
              <LeyendaItem color="rgba(255,255,255,0.9)" label="Bien usados" />
              <LeyendaItem color="rgba(239,68,68,0.9)" label="Desperdiciados" />
            </View>
          </LinearGradient>

          {/* Despensa */}
          <Seccion titulo="Despensa" icono="file-tray-stacked-outline">
            <View style={styles.fila}>
              <EstadisticaItem
                icono="basket-outline"
                valor={estadisticas?.totalProductosRegistrados ?? 0}
                etiqueta="Registrados"
                color={colors.primary}
              />
              <EstadisticaItem
                icono="checkmark-circle-outline"
                valor={estadisticas?.totalProductosConsumidos ?? 0}
                etiqueta="Consumidos"
                color={colors.primaryDark}
              />
            </View>
            <View style={[styles.fila, { marginTop: spacing.md }]}>
              <EstadisticaItem
                icono="alert-circle-outline"
                valor={estadisticas?.totalProductosCaducados ?? 0}
                etiqueta="Caducados"
                color={colors.error}
              />
              <EstadisticaItem
                icono="time-outline"
                valor={pendientes}
                etiqueta="Pendientes"
                color="#888888"
              />
            </View>
            <View style={[styles.fila, { marginTop: spacing.md }]}>
              <EstadisticaItem
                icono="leaf-outline"
                valor={`${Math.round(estadisticas?.aprovechamientoDespensa ?? 0)}%`}
                etiqueta="Aprovechamiento de despensa"
                color={colors.primary}
              />
            </View>
          </Seccion>

          {/* Motivos de eliminación */}
          {estadisticas.motivosEliminacion && (
            <SeccionMotivos motivos={estadisticas.motivosEliminacion} />
          )}

          {/* Recetas */}
          <Seccion titulo="Recetas" icono="restaurant-outline">
            <View style={styles.fila}>
              <EstadisticaItem
                icono="book-outline"
                valor={estadisticas?.totalRecetasPublicadas ?? 0}
                etiqueta="Publicadas"
                color={colors.secondary}
              />
              <EstadisticaItem
                icono="bookmark-outline"
                valor={estadisticas?.totalRecetasGuardadas ?? 0}
                etiqueta="Guardadas"
                color="#F8B133"
              />
            </View>
          </Seccion>

          {/* Actividad y nivel */}
          <Seccion titulo="Actividad" icono="pulse-outline">
            <View style={[styles.nivelCard, { borderLeftColor: nivel.color }]}>
              <View style={[styles.nivelIcono, { backgroundColor: nivel.color + '20' }]}>
                <Ionicons name={nivel.icono} size={28} color={nivel.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nivelCardNombre}>{nivel.nombre}</Text>
                <Text style={styles.nivelCardDesc}>{nivel.descripcion}</Text>
              </View>
              <Text style={[styles.nivelDias, { color: nivel.color }]}>{diasMiembro}d</Text>
            </View>

            <View style={[styles.fila, { marginTop: spacing.md }]}>
              <EstadisticaItem
                icono="calendar-outline"
                valor={diasMiembro}
                etiqueta="Días en MyFoodie"
                color={colors.primary}
              />
              <EstadisticaItem
                icono="trending-up-outline"
                valor={
                  (estadisticas?.totalProductosRegistrados ?? 0) +
                  (estadisticas?.totalRecetasPublicadas ?? 0) +
                  (estadisticas?.totalRecetasGuardadas ?? 0)
                }
                etiqueta="Actividad total"
                color={colors.primaryDark}
              />
            </View>
          </Seccion>

          {/* Zona de peligro */}
          <Seccion titulo="Zona de peligro" icono="warning-outline">
            <Text style={styles.peligroTexto}>
              Elimina de golpe todos los productos de tu despensa. Tu historial y tus estadísticas se
              mantienen.
            </Text>
            <Pressable
              style={styles.peligroBtn}
              onPress={handleVaciarDespensa}
              disabled={isLoading}
              testID="btn-vaciar-despensa"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.peligroBtnTexto}>Vaciar despensa</Text>
            </Pressable>
          </Seccion>

        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const MOTIVOS_CONFIG: {
  key: keyof MotivosEliminacion;
  label: string;
  icono: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}[] = [
  { key: 'consumido',       label: 'Consumido',       icono: 'checkmark-circle-outline', color: colors.primary },
  { key: 'caducado',        label: 'Caducado',        icono: 'warning-outline',           color: colors.error },
  { key: 'usado_en_receta', label: 'En receta',       icono: 'restaurant-outline',        color: '#F5A623' },
  { key: 'donado',          label: 'Donado',          icono: 'heart-outline',             color: '#E91E8C' },
  { key: 'perdido',         label: 'Perdido',         icono: 'help-circle-outline',       color: '#888888' },
  { key: 'errorTipografia', label: 'Añadido por error', icono: 'create-outline',          color: '#5B8DEF' },
  { key: 'otro',            label: 'Otro',            icono: 'ellipsis-horizontal-circle-outline', color: '#7C5CBF' },
];

function SeccionMotivos({ motivos }: { motivos: MotivosEliminacion }) {
  return (
    <View style={seccionStyles.wrapper}>
      <View style={seccionStyles.tituloRow}>
        <Ionicons name="pie-chart-outline" size={14} color={colors.text.secondary} />
        <Text style={seccionStyles.titulo}>Motivos de eliminación</Text>
      </View>
      <View style={[seccionStyles.card, motivosStyles.grid]}>
        {MOTIVOS_CONFIG.map((m) => (
          <View key={m.key} style={motivosStyles.item}>
            <View style={[motivosStyles.iconoBg, { backgroundColor: m.color + '20' }]}>
              <Ionicons name={m.icono} size={20} color={m.color} />
            </View>
            <Text style={motivosStyles.valor}>{motivos[m.key]}</Text>
            <Text style={motivosStyles.label}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  return (
    <View style={seccionStyles.wrapper}>
      <View style={seccionStyles.tituloRow}>
        {icono && <Ionicons name={icono} size={14} color={colors.text.secondary} />}
        <Text style={seccionStyles.titulo}>{titulo}</Text>
      </View>
      <View style={seccionStyles.card}>{children}</View>
    </View>
  );
}

function LeyendaItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={leyendaStyles.row}>
      <View style={[leyendaStyles.dot, { backgroundColor: color }]} />
      <Text style={leyendaStyles.texto}>{label}</Text>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  fila: { flexDirection: 'row', gap: spacing.md },

  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroAnillo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.85)',
  },
  heroPorcentaje: {
    fontSize: 34,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
    lineHeight: 38,
  },
  heroPct: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  nivelNombre: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.white,
  },
  progressTrack: {
    height: 10,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 2,
  },
  progressSeg: {
    borderRadius: borderRadius.full,
  },
  progressLeyenda: {
    flexDirection: 'row',
    gap: spacing.lg,
  },

  nivelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  nivelIcono: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nivelCardNombre: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  nivelCardDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  nivelDias: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  peligroTexto: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  peligroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: '#FFEBEE',
  },
  peligroBtnTexto: {
    ...typography.button,
    color: colors.error,
  },
});

const seccionStyles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  titulo: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
});

const motivosStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    width: '30%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconoBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

const leyendaStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  texto: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.75)' },
});
