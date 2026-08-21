import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificacionItem } from '@/components/notificaciones/NotificacionItem';
import type { Notificacion } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';
import { colors, spacing, typography } from '@/theme';

type GrupoFecha = 'Hoy' | 'Esta semana' | 'Anteriores';

type FilaLista =
  | { tipo: 'header'; id: string; titulo: GrupoFecha }
  | { tipo: 'item'; id: string; notificacion: Notificacion };

function obtenerGrupo(fechaISO: string): GrupoFecha {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias < 1) return 'Hoy';
  if (dias < 7) return 'Esta semana';
  return 'Anteriores';
}

function agruparPorFecha(notificaciones: Notificacion[]): FilaLista[] {
  const grupos: Record<GrupoFecha, Notificacion[]> = {
    Hoy: [],
    'Esta semana': [],
    Anteriores: [],
  };

  notificaciones.forEach((n) => {
    grupos[obtenerGrupo(n.createdAt)].push(n);
  });

  const filas: FilaLista[] = [];
  (['Hoy', 'Esta semana', 'Anteriores'] as const).forEach((titulo) => {
    if (grupos[titulo].length === 0) return;
    filas.push({ tipo: 'header', id: `header-${titulo}`, titulo });
    grupos[titulo].forEach((n) => filas.push({ tipo: 'item', id: n.id, notificacion: n }));
  });

  return filas;
}

export function NotificacionesScreen() {
  const router = useRouter();

  const notificaciones = useNotificacionStore((s) => s.notificaciones);
  const isLoading = useNotificacionStore((s) => s.isLoading);
  const isLoadingMas = useNotificacionStore((s) => s.isLoadingMas);
  const contadorNoLeidas = useNotificacionStore((s) => s.contadorNoLeidas);
  const cargarNotificaciones = useNotificacionStore((s) => s.cargarNotificaciones);
  const cargarMas = useNotificacionStore((s) => s.cargarMas);
  const cargarContador = useNotificacionStore((s) => s.cargarContador);
  const marcarTodasComoLeidas = useNotificacionStore((s) => s.marcarTodasComoLeidas);

  useEffect(() => {
    cargarNotificaciones();
    cargarContador();
  }, []);

  const filas = useMemo(() => agruparPorFecha(notificaciones), [notificaciones]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Notificaciones</Text>
        {contadorNoLeidas > 0 ? (
          <Pressable onPress={() => marcarTodasComoLeidas()} hitSlop={8}>
            <Text style={styles.accionTexto}>Marcar todas</Text>
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <FlatList
        data={filas}
        keyExtractor={(fila) => fila.id}
        contentContainerStyle={filas.length === 0 ? styles.listaVacia : styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargarNotificaciones} tintColor={colors.primary} />
        }
        onEndReached={cargarMas}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) =>
          item.tipo === 'header' ? (
            <Text style={styles.grupoTitulo}>{item.titulo}</Text>
          ) : (
            <NotificacionItem notificacion={item.notificacion} />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListFooterComponent={
          isLoadingMas ? (
            <ActivityIndicator style={styles.loaderMas} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="notifications-off-outline" size={56} color={colors.grayMid} />
              <Text style={styles.vacioTexto}>No tienes notificaciones</Text>
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
  accionTexto: { ...typography.label, color: colors.primaryDark },

  lista: { flexGrow: 1 },
  listaVacia: { flexGrow: 1 },
  separador: { height: 1, backgroundColor: colors.gray },

  grupoTitulo: {
    ...typography.label,
    color: colors.text.secondary,
    backgroundColor: colors.background.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  loaderMas: { paddingVertical: spacing.lg },

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
