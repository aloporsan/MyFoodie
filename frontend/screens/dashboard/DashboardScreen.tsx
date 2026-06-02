import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CarritoResumenCard,
  DashboardEmptyState,
  EstadisticasCard,
  RecetasRecomendadasCard,
  ResumenDespensaCard,
} from '@/components/dashboard';
import { useDashboardStore } from '@/store/dashboardStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function DashboardScreen() {
  const {
    resumen,
    estadisticas,
    carritoResumen,
    recetasRecomendadas,
    isLoading,
    error,
    cargarDashboard,
    refrescar,
  } = useDashboardStore();

  useEffect(() => {
    cargarDashboard();
  }, []);

  const despensaVacia = resumen !== null && resumen.totalProductos === 0;

  if (isLoading && resumen === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && resumen === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={56} color={colors.grayMid} />
          <Text style={styles.errorTitulo}>No se pudo cargar</Text>
          <Text style={styles.errorSubtitulo}>{error}</Text>
          <Pressable style={styles.reintentarBtn} onPress={cargarDashboard}>
            <Text style={styles.reintentarTexto}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      {despensaVacia ? (
        <DashboardEmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refrescar}
              tintColor={colors.primary}
            />
          }
        >
          {resumen && <ResumenDespensaCard resumen={resumen} />}
          {recetasRecomendadas && <RecetasRecomendadasCard />}
          {carritoResumen && <CarritoResumenCard />}
          {estadisticas && <EstadisticasCard estadisticas={estadisticas} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/images/logo-myfoodie.png')}
        style={styles.logoIcon}
        resizeMode="contain"
      />
      <Image
        source={require('@/assets/images/logo-texto.png')}
        style={styles.logoTexto}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  logoIcon: {
    width: 56,
    height: 56,
  },
  logoTexto: {
    height: 48,
    width: 200,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  errorTitulo: {
    ...typography.heading2,
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
    borderRadius: 24,
    marginTop: spacing.sm,
  },
  reintentarTexto: {
    ...typography.button,
    color: colors.white,
  },
});
