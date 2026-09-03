import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EstadisticaItem } from '@/components/perfil/EstadisticaItem';
import { MenuPerfil } from '@/components/perfil/MenuPerfil';
import { PerfilHeader } from '@/components/perfil/PerfilHeader';
import { useCompartirStore } from '@/store/compartirStore';
import { useNotificacionStore } from '@/store/notificacionStore';
import { usePerfilStore } from '@/store/perfilStore';
import { useSocialStore } from '@/store/socialStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

export function PerfilScreen() {
  const router = useRouter();
  const { perfil, estadisticas, isLoading, error, cargarPerfil, cargarEstadisticas } =
    usePerfilStore();
  const seguidores = useSocialStore((s) => s.seguidores);
  const seguidos = useSocialStore((s) => s.seguidos);
  const solicitudesPendientes = useSocialStore((s) => s.solicitudesPendientes);
  const cargarSeguidores = useSocialStore((s) => s.cargarSeguidores);
  const cargarSeguidos = useSocialStore((s) => s.cargarSeguidos);
  const cargarSolicitudes = useSocialStore((s) => s.cargarSolicitudes);
  const contadorNoLeidas = useCompartirStore((s) => s.contadorNoLeidas);
  const cargarContador = useCompartirStore((s) => s.cargarContador);
  const contadorNotificaciones = useNotificacionStore((s) => s.contadorNoLeidas);
  const cargarContadorNotificaciones = useNotificacionStore((s) => s.cargarContador);

  const totalNotificacionesSocial =
    solicitudesPendientes.length + contadorNoLeidas + contadorNotificaciones;

  useEffect(() => {
    cargarPerfil();
    cargarEstadisticas();
    cargarSeguidores();
    cargarSeguidos();
    cargarSolicitudes();
    cargarContador();
    cargarContadorNotificaciones();
  }, []);

  const onRefresh = () => {
    cargarPerfil();
    cargarEstadisticas();
    cargarSeguidores();
    cargarSeguidos();
    cargarSolicitudes();
  };

  if (isLoading && perfil === null) {
    return <LoadingScreen />;
  }

  if (error && perfil === null) {
    return (
      <ErrorScreen
        titulo="No se pudo cargar el perfil"
        descripcion={error}
        onReintentar={onRefresh}
      />
    );
  }

  if (!perfil) return null;

  const diasMiembro = estadisticas?.diasEnMyFoodie ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading && perfil !== null} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerWrapper}>
          <PerfilHeader perfil={perfil} />
          <Pressable
            style={styles.socialBtn}
            onPress={() => router.push('/social')}
            hitSlop={8}
            testID="btn-social"
          >
            <Ionicons name="people-outline" size={20} color={colors.white} />
            {totalNotificacionesSocial > 0 && (
              <View style={styles.socialBadge} testID="badge-social">
                <Text style={styles.socialBadgeTexto}>{totalNotificacionesSocial}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.statsSocialRow}>
          <Pressable style={styles.statSocialItem} onPress={() => router.push('/social/seguidores')}>
            <Text style={styles.statSocialValor}>{seguidores.length}</Text>
            <Text style={styles.statSocialLabel}>Seguidores</Text>
          </Pressable>
          <Pressable style={styles.statSocialItem} onPress={() => router.push('/social/seguidos')}>
            <Text style={styles.statSocialValor}>{seguidos.length}</Text>
            <Text style={styles.statSocialLabel}>Seguidos</Text>
          </Pressable>
          <Pressable
            style={styles.statSocialItem}
            onPress={() => router.push('/perfil/recetas-publicadas')}
          >
            <Text style={styles.statSocialValor}>{estadisticas?.totalRecetasPublicadas ?? 0}</Text>
            <Text style={styles.statSocialLabel}>Recetas</Text>
          </Pressable>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Resumen</Text>
          <View style={styles.statsGrid}>
            <EstadisticaItem
              icono="basket-outline"
              valor={estadisticas?.totalProductosRegistrados ?? 0}
              etiqueta="Productos en despensa"
              color={colors.primary}
            />
            <EstadisticaItem
              icono="book-outline"
              valor={estadisticas?.totalRecetasPublicadas ?? 0}
              etiqueta="Recetas publicadas"
              color={colors.secondary}
            />
          </View>
          <View style={styles.statsGrid}>
            <EstadisticaItem
              icono="bookmark-outline"
              valor={estadisticas?.totalRecetasGuardadas ?? 0}
              etiqueta="Recetas guardadas"
              color="#F8B133"
            />
            <EstadisticaItem
              icono="calendar-outline"
              valor={diasMiembro}
              etiqueta="Días en MyFoodie"
              color={colors.primaryDark}
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Cuenta</Text>
          <MenuPerfil />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  scroll: {
    paddingBottom: spacing.xxxl,
  },
  headerWrapper: {
    position: 'relative',
  },
  socialBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  socialBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  socialBadgeTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  seccion: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  seccionTitulo: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statsSocialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  statSocialItem: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
  },
  statSocialValor: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  statSocialLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  errorTitulo: {
    ...typography.heading3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorSubtitulo: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  reintentarBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  reintentarTexto: {
    ...typography.button,
    color: colors.white,
  },
});
