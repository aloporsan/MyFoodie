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
import { usePerfilStore } from '@/store/perfilStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

export function PerfilScreen() {
  const { perfil, estadisticas, isLoading, error, cargarPerfil, cargarEstadisticas } =
    usePerfilStore();

  useEffect(() => {
    cargarPerfil();
    cargarEstadisticas();
  }, []);

  const onRefresh = () => {
    cargarPerfil();
    cargarEstadisticas();
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

  const diasMiembro = Math.floor(
    (Date.now() - new Date(perfil.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24)
  );

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
        <PerfilHeader perfil={perfil} />

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
