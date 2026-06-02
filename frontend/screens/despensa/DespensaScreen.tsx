import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BuscadorDespensa,
  FiltrosBar,
  ProductoCard,
} from '@/components/despensa';
import { EstadoProducto } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type FiltroId = 'todos' | EstadoProducto;

export function DespensaScreen() {
  const router = useRouter();
  const {
    productos,
    isLoading,
    busquedaActiva,
    cargarProductos,
    actualizarCantidad,
    eliminarProducto,
    setBusqueda,
    setFiltros,
    limpiarFiltros,
  } = useDespensaStore();

  const [filtroActivo, setFiltroActivo] = useState<FiltroId>('todos');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [modalCategoria, setModalCategoria] = useState(false);

  // Chips fijos: se calculan solo con la lista completa (sin filtros activos).
  // Así los chips no desaparecen al seleccionar un filtro concreto.
  const [estadosPresentesBase, setEstadosPresentesBase] = useState<EstadoProducto[]>([]);
  const [categoriasBase, setCategoriasBase] = useState<string[]>([]);

  const filtroActivoRef = useRef(filtroActivo);
  const categoriaActivaRef = useRef(categoriaActiva);
  filtroActivoRef.current = filtroActivo;
  categoriaActivaRef.current = categoriaActiva;

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (!busquedaActiva.trim() && filtroActivoRef.current === 'todos' && !categoriaActivaRef.current) {
      setEstadosPresentesBase([...new Set(productos.map((p) => p.estado))] as EstadoProducto[]);
      setCategoriasBase([...new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])]);
    }
  }, [productos, busquedaActiva]);

  const categorias = categoriasBase;

  const handleSearch = useCallback((texto: string) => {
    setBusqueda(texto);
    setFiltroActivo('todos');
    setCategoriaActiva('');
    limpiarFiltros();
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

  const handleEliminar = useCallback((id: string, nombre: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${nombre}" de tu despensa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarProducto(id) },
      ]
    );
  }, []);

  const estaFiltrandoOBuscando = busquedaActiva.trim() || filtroActivo !== 'todos' || categoriaActiva;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
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

      {/* Filtros de estado (dinámicos) */}
      <FiltrosBar
        filtroActivo={filtroActivo}
        estadosPresentes={estadosPresentesBase}
        onFiltroChange={handleFiltroEstado}
      />

      {/* Lista */}
      {isLoading && productos.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={cargarProductos}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ProductoCard
              producto={item}
              onPress={() => router.push(`/despensa/${item.id}`)}
              onEditar={() => router.push({ pathname: '/despensa/form', params: { id: item.id } })}
              onEliminar={() => handleEliminar(item.id, item.nombre)}
              onIncrementar={() => actualizarCantidad(item.id, 1)}
              onDecrementar={() => actualizarCantidad(item.id, -1)}
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
      )}

      {/* Modal categorías */}
      <Modal visible={modalCategoria} transparent animationType="slide" onRequestClose={() => setModalCategoria(false)}>
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

            {categorias.map((cat) => (
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
  headerSide: {
    flex: 1,
    alignItems: 'flex-end',
  },
  titulo: {
    ...typography.heading1,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
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
  categoriaBtnActivo: {
    backgroundColor: '#E8F5D0',
    borderColor: colors.primary,
  },
  categoriaBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    flexShrink: 1,
  },
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xs,
  },
  sheetTitulo: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
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
});
