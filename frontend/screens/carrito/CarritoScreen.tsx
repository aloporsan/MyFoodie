import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { FormItemManual, ItemCarritoCard, ResumenCarritoHeader } from '@/components/carrito';
import { ItemCarritoInput } from '@/services/carritoService';
import { useCarritoStore } from '@/store/carritoStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type TabId = 'recomendaciones' | 'aceptados' | 'rechazados';

const TABS: { id: TabId; label: string }[] = [
  { id: 'recomendaciones', label: 'Recomendaciones' },
  { id: 'aceptados', label: 'Aceptados' },
  { id: 'rechazados', label: 'Rechazados' },
];

const PRIORIDADES: { key: 'alta' | 'media' | 'baja'; label: string }[] = [
  { key: 'alta', label: 'Prioridad alta' },
  { key: 'media', label: 'Prioridad media' },
  { key: 'baja', label: 'Prioridad baja' },
];

const EMPTY_CONFIG: Record<TabId, { icon: string; titulo: string; subtitulo: string }> = {
  recomendaciones: {
    icon: 'sparkles-outline',
    titulo: 'Sin recomendaciones',
    subtitulo: 'Desliza hacia abajo para generar sugerencias de compra',
  },
  aceptados: {
    icon: 'checkmark-circle-outline',
    titulo: 'Nada aceptado todavía',
    subtitulo: 'Acepta recomendaciones en la pestaña anterior para verlas aquí',
  },
  rechazados: {
    icon: 'close-circle-outline',
    titulo: 'Nada rechazado',
    subtitulo: 'Los productos que rechaces aparecerán aquí',
  },
};

export function CarritoScreen() {
  const router = useRouter();
  const {
    items,
    resumen,
    isLoading,
    isGenerando,
    cargarCarrito,
    generarCarrito,
    aceptarItem,
    rechazarItem,
    marcarNoVolver,
    recuperarItem,
    modificarCantidad,
    añadirItemManual,
  } = useCarritoStore();

  const [tab, setTab] = useState<TabId>('recomendaciones');
  const [modalManual, setModalManual] = useState(false);
  const [añadiendoManual, setAñadiendoManual] = useState(false);

  useEffect(() => {
    cargarCarrito();
  }, []);

  const handleGenerarLista = useCallback(() => {
    router.push('/carrito/generar-lista');
  }, [router]);

  // dismissTo cierra de golpe cualquier pantalla apilada del flujo del carrito
  // (evita tener que pulsar "atrás" más de una vez para volver al Dashboard).
  const goBack = () => router.dismissTo('/(tabs)');

  const handleAñadirManual = async (datos: ItemCarritoInput) => {
    setAñadiendoManual(true);
    try {
      await añadirItemManual(datos);
      setModalManual(false);
    } finally {
      setAñadiendoManual(false);
    }
  };

  const pendientes = items.filter((i) => i.estado === 'pendiente');
  const aceptados = items.filter((i) => i.estado === 'aceptado');
  const rechazados = items.filter((i) => i.estado === 'rechazado');
  const dataTab = tab === 'aceptados' ? aceptados : rechazados;

  if (isLoading && items.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LoadingOverlay visible={isLoading && items.length > 0} />

      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Carrito inteligente</Text>
        <Pressable
          onPress={generarCarrito}
          disabled={isGenerando}
          hitSlop={8}
          style={styles.backBtn}
        >
          {isGenerando ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="refresh" size={22} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <View style={styles.resumenWrapper}>
        <ResumenCarritoHeader resumen={resumen} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActivo]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActivo]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'recomendaciones' ? (
        <FlatList
          data={PRIORIDADES}
          keyExtractor={(p) => p.key}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={isGenerando} onRefresh={generarCarrito} tintColor={colors.primary} />
          }
          renderItem={({ item: grupo }) => {
            const itemsGrupo = pendientes.filter((i) => i.prioridad === grupo.key);
            if (itemsGrupo.length === 0) return null;
            return (
              <View style={styles.grupo}>
                <Text style={styles.grupoTitulo}>{grupo.label}</Text>
                {itemsGrupo.map((item) => (
                  <ItemCarritoCard
                    key={item.id}
                    item={item}
                    onAceptar={() => aceptarItem(item.id)}
                    onRechazar={() => rechazarItem(item.id)}
                    onNoVolver={() => marcarNoVolver(item.id)}
                    onModificarCantidad={(cantidad, unidad) => modificarCantidad(item.id, cantidad, unidad)}
                  />
                ))}
              </View>
            );
          }}
          ListEmptyComponent={<EmptyTab tab="recomendaciones" />}
        />
      ) : (
        <FlatList
          data={dataTab}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={cargarCarrito} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <ItemCarritoCard
              item={item}
              onRechazar={() => rechazarItem(item.id)}
              onRecuperar={tab === 'rechazados' ? () => recuperarItem(item.id) : undefined}
            />
          )}
          ListEmptyComponent={<EmptyTab tab={tab} />}
        />
      )}

      <Pressable style={styles.fab} onPress={() => setModalManual(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btnFooterLista, aceptados.length === 0 && styles.btnDisabled]}
          onPress={handleGenerarLista}
          disabled={aceptados.length === 0}
        >
          <Ionicons name="list-outline" size={18} color={colors.white} />
          <Text style={styles.btnFooterListaText}>Generar lista de compra</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalManual}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setModalManual(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalManual(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>Añadir producto</Text>
            <FormItemManual onAñadir={handleAñadirManual} isLoading={añadiendoManual} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyTab({ tab }: { tab: TabId }) {
  const { icon, titulo, subtitulo } = EMPTY_CONFIG[tab];
  return (
    <View style={styles.centered}>
      <Ionicons name={icon as any} size={56} color={colors.grayMid} />
      <Text style={styles.emptyTitulo}>{titulo}</Text>
      <Text style={styles.emptySubtitulo}>{subtitulo}</Text>
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
  },
  backBtn: { width: 24 },
  titulo: { ...typography.heading2, color: colors.text.primary, flex: 1, textAlign: 'center' },
  resumenWrapper: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  tabActivo: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabTextActivo: {
    color: colors.white,
  },
  lista: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 },
  grupo: { marginBottom: spacing.md },
  grupoTitulo: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyTitulo: { ...typography.heading2, color: colors.text.primary, textAlign: 'center' },
  emptySubtitulo: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  btnFooterLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
  },
  btnFooterListaText: {
    ...typography.button,
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  modalTitulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
