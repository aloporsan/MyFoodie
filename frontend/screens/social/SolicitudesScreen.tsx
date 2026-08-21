import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { SolicitudCard } from '@/components/social';
import { useToast } from '@/hooks/useToast';
import { useSocialStore } from '@/store/socialStore';
import { colors, spacing, typography } from '@/theme';

export function SolicitudesScreen() {
  const router = useRouter();
  const { showError } = useToast();

  const solicitudesPendientes = useSocialStore((s) => s.solicitudesPendientes);
  const isLoading = useSocialStore((s) => s.isLoading);
  const cargarSolicitudes = useSocialStore((s) => s.cargarSolicitudes);
  const aceptarSolicitud = useSocialStore((s) => s.aceptarSolicitud);
  const rechazarSolicitud = useSocialStore((s) => s.rechazarSolicitud);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleAceptar = async (usuarioId: string) => {
    try {
      await aceptarSolicitud(usuarioId);
    } catch {
      showError('No se pudo aceptar la solicitud');
    }
  };

  const handleRechazar = async (usuarioId: string) => {
    try {
      await rechazarSolicitud(usuarioId);
    } catch {
      showError('No se pudo rechazar la solicitud');
    }
  };

  if (isLoading && solicitudesPendientes.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Solicitudes de seguimiento</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={solicitudesPendientes}
        keyExtractor={(s) => s.id}
        contentContainerStyle={solicitudesPendientes.length === 0 ? styles.listaVacia : styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargarSolicitudes} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <SolicitudCard
            solicitud={item}
            onAceptar={() => handleAceptar(item.usuarioId)}
            onRechazar={() => handleRechazar(item.usuarioId)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="people-outline" size={56} color={colors.grayMid} />
              <Text style={styles.vacioTexto}>No tienes solicitudes pendientes</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
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
    borderBottomColor: colors.gray,
  },
  titulo: { ...typography.heading2, color: colors.text.primary },

  lista: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  listaVacia: { flexGrow: 1 },

  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  vacioTexto: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
