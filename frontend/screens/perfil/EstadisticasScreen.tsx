import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EstadisticaItem } from '@/components/perfil/EstadisticaItem';
import { usePerfilStore } from '@/store/perfilStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import type { EstadisticasPerfil } from '@/services/perfilService';

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
  if (stats.totalProductosRegistrados === 0) return null;
  return Math.round((stats.totalProductosConsumidos / stats.totalProductosRegistrados) * 100);
}

export function EstadisticasScreen() {
  const router = useRouter();
  const { perfil, estadisticas, isLoading, cargarEstadisticas } = usePerfilStore();

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const diasMiembro = perfil
    ? Math.floor((Date.now() - new Date(perfil.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const nivel = getNivel(estadisticas?.totalProductosRegistrados ?? 0);
  const eficiencia = estadisticas ? calcularEficiencia(estadisticas) : null;
  const totalResueltos =
    (estadisticas?.totalProductosConsumidos ?? 0) + (estadisticas?.totalProductosCaducados ?? 0);
  const pendientes = Math.max(
    0,
    (estadisticas?.totalProductosRegistrados ?? 0) - totalResueltos,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && !estadisticas ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero card */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>Eficiencia alimentaria</Text>
                <Text style={styles.heroPorcentaje}>
                  {eficiencia !== null ? `${eficiencia}%` : '--'}
                </Text>
                {estadisticas && (
                  <Text style={styles.heroSub}>
                    {estadisticas.totalProductosConsumidos} consumidos · {estadisticas.totalProductosCaducados} caducados
                  </Text>
                )}
              </View>
              <View style={styles.nivelBadge}>
                <Ionicons name={nivel.icono} size={20} color={colors.white} />
                <Text style={styles.nivelNombre}>{nivel.nombre}</Text>
              </View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressTrack}>
              {totalResueltos > 0 || pendientes > 0 ? (
                <>
                  {(estadisticas?.totalProductosConsumidos ?? 0) > 0 && (
                    <View style={[styles.progressSeg, {
                      flex: estadisticas!.totalProductosConsumidos,
                      backgroundColor: 'rgba(255,255,255,0.85)',
                    }]} />
                  )}
                  {(estadisticas?.totalProductosCaducados ?? 0) > 0 && (
                    <View style={[styles.progressSeg, {
                      flex: estadisticas!.totalProductosCaducados,
                      backgroundColor: 'rgba(239,68,68,0.75)',
                    }]} />
                  )}
                  {pendientes > 0 && (
                    <View style={[styles.progressSeg, {
                      flex: pendientes,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                    }]} />
                  )}
                </>
              ) : (
                <View style={[styles.progressSeg, { flex: 1, backgroundColor: 'rgba(255,255,255,0.25)' }]} />
              )}
            </View>
            <View style={styles.progressLeyenda}>
              <LeyendaItem color="rgba(255,255,255,0.85)" label="Consumidos" />
              <LeyendaItem color="rgba(239,68,68,0.9)" label="Caducados" />
              <LeyendaItem color="rgba(255,255,255,0.4)" label="Pendientes" />
            </View>
          </LinearGradient>

          {/* Despensa */}
          <Seccion titulo="Despensa">
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
                color="#888"
              />
            </View>
          </Seccion>

          {/* Recetas */}
          <Seccion titulo="Recetas">
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
          <Seccion titulo="Actividad">
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

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={seccionStyles.wrapper}>
      <Text style={seccionStyles.titulo}>{titulo}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  heroPorcentaje: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: colors.white,
    lineHeight: 52,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  nivelNombre: {
    fontSize: 13,
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
});

const seccionStyles = StyleSheet.create({
  wrapper: { gap: spacing.md },
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

const leyendaStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  texto: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.75)' },
});
