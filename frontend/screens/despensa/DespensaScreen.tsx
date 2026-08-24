import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import {
  AlertaDuplicados,
  BuscadorDespensa,
  CantidadMotivoSheet,
  FiltrosBar,
  ProductoCard,
} from '@/components/despensa';
import { useToast } from '@/hooks/useToast';
import { EstadoProducto, MotivoEliminacion } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';
import { useFusionStore } from '@/store/fusionStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type FiltroId = 'todos' | EstadoProducto;

const MOTIVOS_ELIMINAR: { key: MotivoEliminacion; label: string; icono: string }[] = [
  { key: 'consumido',       label: 'Consumido',       icono: 'checkmark-circle-outline' },
  { key: 'caducado',        label: 'Caducado',        icono: 'warning-outline' },
  { key: 'usado_en_receta', label: 'Usado en receta', icono: 'restaurant-outline' },
  { key: 'donado',          label: 'Donado',          icono: 'heart-outline' },
  { key: 'perdido',         label: 'Perdido',         icono: 'help-circle-outline' },
  { key: 'otro',            label: 'Otro motivo',     icono: 'ellipsis-horizontal-circle-outline' },
];

export function DespensaScreen() {
  const router = useRouter();
  const { showError } = useToast();
  const {
    productos,
    isLoading,
    busquedaActiva,
    ordenActivo,
    cargarProductos,
    actualizarCantidad,
    eliminarProducto,
    setBusqueda,
    setFiltros,
    limpiarFiltros,
    setOrden,
    inicializarOrden,
  } = useDespensaStore();
  const { duplicados, cargarDuplicados } = useFusionStore();

  const [filtroActivo, setFiltroActivo] = useState<FiltroId>('todos');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [modalCategoria, setModalCategoria] = useState(false);

  // Estado para el modal de eliminar
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteNombre, setPendingDeleteNombre] = useState('');
  const [motivoEliminar, setMotivoEliminar] = useState<MotivoEliminacion | null>(null);
  const [motivoDetalleEliminar, setMotivoDetalleEliminar] = useState('');

  // Estado para el sheet de cantidad
  const [pendingCantidadId, setPendingCantidadId] = useState<string | null>(null);
  const [pendingCantidadUnidad, setPendingCantidadUnidad] = useState('');
  const [pendingCantidadModo, setPendingCantidadModo] = useState<'sumar' | 'restar'>('restar');
  const [pendingCantidadDisponible, setPendingCantidadDisponible] = useState(0);

  const [estadosPresentesBase, setEstadosPresentesBase] = useState<EstadoProducto[]>([]);
  const [categoriasBase, setCategoriasBase] = useState<string[]>([]);

  const filtroActivoRef = useRef(filtroActivo);
  const categoriaActivaRef = useRef(categoriaActiva);
  filtroActivoRef.current = filtroActivo;
  categoriaActivaRef.current = categoriaActiva;

  useEffect(() => {
    const iniciar = async () => {
      await inicializarOrden();
      cargarProductos();
    };
    iniciar();
    cargarDuplicados();
  }, []);

  useEffect(() => {
    if (!busquedaActiva.trim() && filtroActivoRef.current === 'todos' && !categoriaActivaRef.current) {
      setEstadosPresentesBase([...new Set(productos.map((p) => p.estado))] as EstadoProducto[]);
      setCategoriasBase([...new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])]);
    }
  }, [productos, busquedaActiva]);

  const handleSearch = useCallback((texto: string) => {
    limpiarFiltros();
    setFiltroActivo('todos');
    setCategoriaActiva('');
    setBusqueda(texto);
    setTimeout(() => cargarProductos(), 0);
  }, []);

  const handleFiltroEstado = useCallback((id: FiltroId) => {
    setFiltroActivo(id);
    setCategoriaActiva('');
    setBusqueda('');
    if (id === 'todos') {
      limpiarFiltros();
    } else {
      setFiltros({ estado: id as EstadoProducto });
    }
    setTimeout(() => cargarProductos(), 0);
  }, []);

  const handleFiltroCategoria = useCallback((cat: string) => {
    setCategoriaActiva(cat);
    setFiltroActivo('todos');
    setBusqueda('');
    if (cat) {
      setFiltros({ categoria: cat });
    } else {
      limpiarFiltros();
    }
    setModalCategoria(false);
    setTimeout(() => cargarProductos(), 0);
  }, []);

  // Eliminar con motivo
  const handleEliminar = useCallback((id: string, nombre: string) => {
    setPendingDeleteId(id);
    setPendingDeleteNombre(nombre);
    setMotivoEliminar(null);
    setMotivoDetalleEliminar('');
  }, []);

  const confirmarEliminar = async () => {
    if (!pendingDeleteId || !motivoEliminar) return;
    const detalle =
      motivoEliminar === 'otro' && motivoDetalleEliminar.trim()
        ? motivoDetalleEliminar.trim()
        : undefined;
    await eliminarProducto(pendingDeleteId, motivoEliminar, detalle);
    setPendingDeleteId(null);
  };

  // Cantidad con motivo
  const handleDecrementar = useCallback((id: string, unidad: string, cantidadDisponible: number) => {
    setPendingCantidadId(id);
    setPendingCantidadUnidad(unidad);
    setPendingCantidadModo('restar');
    setPendingCantidadDisponible(cantidadDisponible);
  }, []);

  const handleIncrementar = useCallback((id: string, unidad: string) => {
    setPendingCantidadId(id);
    setPendingCantidadUnidad(unidad);
    setPendingCantidadModo('sumar');
  }, []);

  const confirmarCantidad = async (
    cantidad: number,
    motivo?: MotivoEliminacion,
    motivoDetalle?: string
  ) => {
    if (!pendingCantidadId) return;
    const delta = pendingCantidadModo === 'sumar' ? cantidad : -cantidad;
    try {
      await actualizarCantidad(pendingCantidadId, delta, motivo, motivoDetalle);
      setPendingCantidadId(null);
    } catch {
      showError('No puedes quitar más cantidad de la que tienes disponible');
    }
  };

  const estaFiltrandoOBuscando = busquedaActiva.trim() || filtroActivo !== 'todos' || categoriaActiva;

  if (isLoading && productos.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading && productos.length > 0} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            style={styles.escanearBtn}
            onPress={() => router.push('/despensa/ocr')}
            testID="btn-escanear-ticket"
          >
            <Ionicons name="camera-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        <Text style={styles.titulo}>Mi despensa</Text>
        <View style={styles.headerSide}>
          <Pressable style={styles.addBtn} onPress={() => router.push('/despensa/form')}>
            <Ionicons name="add" size={24} color={colors.white} />
          </Pressable>
        </View>
      </View>

      {/* Buscador + filtro categoría */}
      <View style={styles.buscadorRow}>
        <View style={styles.buscadorFlex}>
          <BuscadorDespensa value={busquedaActiva} onSearch={handleSearch} />
        </View>
        <Pressable
          style={[styles.categoriaBtn, categoriaActiva && styles.categoriaBtnActivo]}
          onPress={() => setModalCategoria(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={categoriaActiva ? colors.primary : colors.grayDark}
          />
          {categoriaActiva ? (
            <Text style={styles.categoriaBtnText} numberOfLines={1}>{categoriaActiva}</Text>
          ) : null}
        </Pressable>
      </View>

      {/* Filtros de estado y ordenación */}
      <FiltrosBar
        filtroActivo={filtroActivo}
        estadosPresentes={estadosPresentesBase}
        onFiltroChange={handleFiltroEstado}
        ordenActivo={ordenActivo}
        onOrdenChange={setOrden}
      />

      {/* Lista */}
      <FlatList
        data={productos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { cargarProductos(); cargarDuplicados(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          duplicados.length > 0 ? (
            <AlertaDuplicados
              cantidad={duplicados.length}
              onRevisar={() => router.push('/despensa/duplicados')}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ProductoCard
            producto={item}
            onPress={() => router.push(`/despensa/${item.id}`)}
            onEditar={() => router.push({ pathname: '/despensa/form', params: { id: item.id } })}
            onEliminar={() => handleEliminar(item.id, item.nombre)}
            onIncrementar={() => handleIncrementar(item.id, item.unidad)}
            onDecrementar={() => handleDecrementar(item.id, item.unidad, item.cantidad)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons
              name={estaFiltrandoOBuscando ? 'search-outline' : 'basket-outline'}
              size={56}
              color={colors.grayMid}
            />
            <Text style={styles.emptyTitulo}>
              {estaFiltrandoOBuscando ? 'Sin resultados' : 'Tu despensa está vacía'}
            </Text>
            <Text style={styles.emptySubtitulo}>
              {estaFiltrandoOBuscando
                ? 'Prueba con otro término o quita los filtros'
                : 'Añade productos con el botón +'}
            </Text>
            {!estaFiltrandoOBuscando && (
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/despensa/form')}>
                <Text style={styles.emptyBtnText}>Añadir producto</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* Modal categorías */}
      <Modal
        visible={modalCategoria}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCategoria(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalCategoria(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitulo}>Filtrar por categoría</Text>
            <Pressable
              style={[styles.categoriaOpcion, !categoriaActiva && styles.categoriaOpcionActiva]}
              onPress={() => handleFiltroCategoria('')}
            >
              <Ionicons name="grid-outline" size={18} color={!categoriaActiva ? colors.primary : colors.grayDark} />
              <Text style={[styles.categoriaOpcionText, !categoriaActiva && { color: colors.primary, fontWeight: '700' }]}>
                Todas las categorías
              </Text>
              {!categoriaActiva && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </Pressable>
            {categoriasBase.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.categoriaOpcion, categoriaActiva === cat && styles.categoriaOpcionActiva]}
                onPress={() => handleFiltroCategoria(cat)}
              >
                <Ionicons name="pricetag-outline" size={18} color={categoriaActiva === cat ? colors.primary : colors.grayDark} />
                <Text style={[styles.categoriaOpcionText, categoriaActiva === cat && { color: colors.primary, fontWeight: '700' }]}>
                  {cat}
                </Text>
                {categoriaActiva === cat && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal eliminar con motivo */}
      <Modal
        visible={pendingDeleteId !== null}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setPendingDeleteId(null)}
      >
        <View style={styles.motivoContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPendingDeleteId(null)} />
          <View style={styles.motivoSheet}>
            <Text style={styles.motivoTitulo}>
              ¿Por qué eliminas "{pendingDeleteNombre}"?
            </Text>
            {MOTIVOS_ELIMINAR.map((m) => (
              <Pressable
                key={m.key}
                style={[styles.motivoBtn, motivoEliminar === m.key && styles.motivoBtnActivo]}
                onPress={() => setMotivoEliminar(m.key)}
              >
                <Ionicons
                  name={m.icono as any}
                  size={18}
                  color={motivoEliminar === m.key ? colors.white : colors.text.secondary}
                />
                <Text style={[styles.motivoBtnText, motivoEliminar === m.key && styles.motivoBtnTextActivo]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
            {motivoEliminar === 'otro' && (
              <TextInput
                style={styles.motivoInput}
                placeholder="Describe el motivo (opcional)"
                placeholderTextColor={colors.text.secondary}
                value={motivoDetalleEliminar}
                onChangeText={setMotivoDetalleEliminar}
                maxLength={200}
              />
            )}
            <View style={styles.motivoBotones}>
              <Pressable style={styles.btnCancelar} onPress={() => setPendingDeleteId(null)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.btnEliminar, !motivoEliminar && styles.btnDisabled]}
                onPress={confirmarEliminar}
                disabled={!motivoEliminar}
              >
                <Text style={styles.btnEliminarText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sheet cantidad con motivo */}
      <CantidadMotivoSheet
        visible={pendingCantidadId !== null}
        unidad={pendingCantidadUnidad}
        modo={pendingCantidadModo}
        maxCantidad={pendingCantidadModo === 'restar' ? pendingCantidadDisponible : undefined}
        onConfirm={confirmarCantidad}
        onCancelar={() => setPendingCantidadId(null)}
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
  },
  headerSide: { flex: 1, alignItems: 'flex-end' },
  titulo: { ...typography.heading1, color: colors.text.primary, textAlign: 'center', flex: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escanearBtn: {
    backgroundColor: colors.grayLight,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buscadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  buscadorFlex: { flex: 1 },
  categoriaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    maxWidth: 120,
  },
  categoriaBtnActivo: { backgroundColor: '#E8F5D0', borderColor: colors.primary },
  categoriaBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700', flexShrink: 1 },
  lista: { padding: spacing.lg, flexGrow: 1 },
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
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  emptyBtnText: { ...typography.button, color: colors.white },
  // Modal categorías (mantiene patrón original con Pressable anidado)
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xs,
  },
  sheetTitulo: { ...typography.heading2, color: colors.text.primary, marginBottom: spacing.md },
  categoriaOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  categoriaOpcionActiva: { backgroundColor: '#E8F5D0' },
  categoriaOpcionText: { ...typography.body, color: colors.text.primary, flex: 1 },
  // Modal eliminar
  motivoContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  motivoSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  motivoTitulo: { ...typography.heading2, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm },
  motivoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  motivoBtnActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  motivoBtnText: { ...typography.body, color: colors.text.secondary },
  motivoBtnTextActivo: { color: colors.white },
  motivoInput: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
  motivoBotones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btnCancelar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
  },
  btnCancelarText: { ...typography.button, color: colors.text.secondary },
  btnEliminar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  btnEliminarText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
