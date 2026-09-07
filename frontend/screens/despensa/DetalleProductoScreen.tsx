import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CantidadMotivoSheet, FormNuevoLote, ListaLotes, LoteCard, ProductoEstadoBadge } from '@/components/despensa';
import { showConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { ConsumoLote, MotivoEliminacion, MovimientoProducto } from '@/services/despensaService';
import { CriterioFechaLote, LoteProducto, LoteProductoInput } from '@/services/loteService';
import { useDespensaStore } from '@/store/despensaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const MOTIVOS: { key: MotivoEliminacion; label: string; icono: string }[] = [
  { key: 'consumido',       label: 'Consumido',       icono: 'checkmark-circle-outline' },
  { key: 'caducado',        label: 'Caducado',        icono: 'warning-outline' },
  { key: 'usado_en_receta', label: 'Usado en receta', icono: 'restaurant-outline' },
  { key: 'donado',          label: 'Donado',          icono: 'heart-outline' },
  { key: 'perdido',         label: 'Perdido',         icono: 'help-circle-outline' },
  { key: 'otro',            label: 'Otro motivo',     icono: 'ellipsis-horizontal-circle-outline' },
];

const TIPO_ICONO: Record<string, { name: string; color: string }> = {
  añadido:              { name: 'add-circle-outline',    color: colors.primary },
  editado:              { name: 'pencil-outline',         color: '#4A90E2' },
  cantidad_actualizada: { name: 'swap-vertical-outline', color: '#F5A623' },
  eliminado:            { name: 'trash-outline',         color: colors.error },
};

export function DetalleProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showError } = useToast();
  const {
    productos,
    actualizarCantidad,
    eliminarProducto,
    historialProducto,
    cargarHistorial,
    lotesProductoActual,
    cargarLotes,
    añadirLote,
    editarLote,
    eliminarLote,
    compactarLotes,
  } = useDespensaStore();

  // Modal eliminar
  const [motivoModal, setMotivoModal] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoEliminacion | null>(null);
  const [motivoDetalleTexto, setMotivoDetalleTexto] = useState('');

  // Sheet de cantidad
  const [cantidadSheet, setCantidadSheet] = useState(false);
  const [cantidadModo, setCantidadModo] = useState<'sumar' | 'restar'>('restar');

  // La gestión por lotes es obligatoria: todo producto tiene al menos un lote y la sección
  // está siempre visible. Al pulsar "+" se elige a qué lote concreto se añade la cantidad
  // (o se crea uno nuevo) en vez de sumar a ciegas — ver handleMas.
  const [modalLote, setModalLote] = useState(false);
  const [loteEditando, setLoteEditando] = useState<LoteProducto | null>(null);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [loteObjetivoSuma, setLoteObjetivoSuma] = useState<LoteProducto | null>(null);
  const [modalElegirLote, setModalElegirLote] = useState(false);

  const producto = productos.find((p) => p.id === id);

  // Recarga historial y lotes cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      if (id) {
        cargarHistorial(id);
        cargarLotes(id);
      }
    }, [id])
  );

  if (!producto) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.noEncontrado}>Producto no encontrado</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.volver}>← Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleMenos = () => {
    setLoteObjetivoSuma(null);
    setCantidadModo('restar');
    setCantidadSheet(true);
  };

  const formatFechaLote = (fecha?: string | null) => {
    if (!fecha) return 'sin fecha';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  };

  // Sumar a ciegas desincronizaría el total del producto respecto a sus lotes. Por eso hay
  // que decidir explícitamente a qué lote va esa cantidad, o si se trata de una compra nueva.
  const handleMas = () => {
    setModalElegirLote(true);
  };

  const handleElegirLoteExistente = (lote: LoteProducto) => {
    setModalElegirLote(false);
    setLoteObjetivoSuma(lote);
    setCantidadModo('sumar');
    setCantidadSheet(true);
  };

  const handleElegirLoteNuevo = () => {
    setModalElegirLote(false);
    handleNuevoLote();
  };

  // El lote que caduca antes es siempre el primero (el backend ya los devuelve ordenados por
  // fecha ascendente): al restar, el descuento consumirá de ahí primero.
  const proximoLoteAConsumir = producto?.tieneLotes ? lotesProductoActual[0] : undefined;
  const avisoRestar = proximoLoteAConsumir
    ? `Se descontará primero del lote que caduca ${
        proximoLoteAConsumir.fechaCaducidad
          ? `el ${formatFechaLote(proximoLoteAConsumir.fechaCaducidad)}`
          : 'antes'
      } (${proximoLoteAConsumir.cantidad} ${proximoLoteAConsumir.unidad}).`
    : undefined;

  const mostrarResumenConsumo = (consumos: ConsumoLote[]) => {
    const lineas = consumos.map((c) => {
      const linea = `Lote del ${formatFechaLote(c.fechaCaducidad)}: -${c.cantidadConsumida} ${producto?.unidad ?? ''}`;
      return c.loteEliminado ? `${linea} (agotado)` : `${linea} · quedan ${c.cantidadRestante}`;
    });
    showConfirm('Consumido de tus lotes', lineas.join('\n'), undefined, { icon: 'layers-outline' });
  };

  const confirmarCantidad = async (
    cantidad: number,
    motivo?: MotivoEliminacion,
    motivoDetalle?: string
  ) => {
    setCantidadSheet(false);

    // Sumar a un lote concreto ya elegido en handleMas: no toca la cantidad del producto
    // directamente, se recalcula sola a partir del lote actualizado.
    if (cantidadModo === 'sumar' && loteObjetivoSuma) {
      const lote = loteObjetivoSuma;
      setLoteObjetivoSuma(null);
      try {
        await editarLote(id, lote.id, {
          cantidad: lote.cantidad + cantidad,
          unidad: lote.unidad,
          fechaCaducidad: lote.fechaCaducidad,
          fechaCompra: lote.fechaCompra,
          origen: lote.origen,
        });
      } catch {
        showError('No se pudo actualizar el lote');
      }
      return;
    }

    const delta = cantidadModo === 'sumar' ? cantidad : -cantidad;
    try {
      const actualizado = await actualizarCantidad(id, delta, motivo, motivoDetalle);
      cargarHistorial(id);
      if (actualizado.consumosFifo && actualizado.consumosFifo.length > 0) {
        mostrarResumenConsumo(actualizado.consumosFifo);
      }
    } catch {
      showError('No puedes quitar más cantidad de la que tienes disponible');
    }
  };

  const handleEliminar = () => {
    setMotivoSeleccionado(null);
    setMotivoDetalleTexto('');
    setMotivoModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!motivoSeleccionado) return;
    setMotivoModal(false);
    const detalle =
      motivoSeleccionado === 'otro' && motivoDetalleTexto.trim()
        ? motivoDetalleTexto.trim()
        : undefined;
    await eliminarProducto(id, motivoSeleccionado, detalle);
    router.back();
  };

  const handleNuevoLote = () => {
    setLoteEditando(null);
    setModalLote(true);
  };

  const handleEditarLote = (lote: LoteProducto) => {
    setLoteEditando(lote);
    setModalLote(true);
  };

  const handleGuardarLote = async (datos: LoteProductoInput) => {
    setGuardandoLote(true);
    try {
      if (loteEditando) {
        await editarLote(id, loteEditando.id, datos);
      } else {
        await añadirLote(id, datos);
      }
      setModalLote(false);
    } catch {
      showError('No se pudo guardar el lote');
    } finally {
      setGuardandoLote(false);
    }
  };

  const handleCompactarLotes = () => {
    showConfirm(
      'Compactar lotes',
      'Se fusionarán todos los lotes activos en uno solo, sumando sus cantidades. ¿Qué fecha de caducidad quieres conservar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'La fecha más próxima', onPress: () => ejecutarCompactar('MAS_TEMPRANA') },
        { text: 'La fecha más lejana', onPress: () => ejecutarCompactar('MAS_TARDIA') },
      ]
    );
  };

  const ejecutarCompactar = async (criterioFecha: CriterioFechaLote) => {
    try {
      await compactarLotes(id, criterioFecha);
    } catch {
      showError('No se pudieron compactar los lotes');
    }
  };

  const handleEliminarLote = (lote: LoteProducto) => {
    showConfirm(
      'Eliminar lote',
      `¿Eliminar este lote de ${lote.cantidad} ${lote.unidad}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarLote(id, lote.id);
            } catch {
              showError('No se pudo eliminar el lote');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>{producto.nombre}</Text>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/despensa/form', params: { id: producto.id } })
          }
          hitSlop={8}
        >
          <Ionicons name="pencil-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Badge de estado */}
        <View style={styles.badgeRow}>
          <ProductoEstadoBadge estado={producto.estado} size="md" />
        </View>

        {/* Marca */}
        {producto.marca && <Text style={styles.marca}>{producto.marca}</Text>}

        {/* Control de cantidad */}
        <View style={styles.cantidadCard}>
          <Text style={styles.cantidadLabel}>Cantidad</Text>
          <View style={styles.cantidadRow}>
            <Pressable
              style={[styles.cantidadBtn, producto.cantidad === 0 && styles.cantidadBtnDisabled]}
              onPress={handleMenos}
              disabled={producto.cantidad === 0}
            >
              <Ionicons
                name="remove"
                size={24}
                color={producto.cantidad === 0 ? colors.grayDark : colors.primary}
              />
            </Pressable>
            <Text style={styles.cantidadValor}>
              {producto.cantidad} <Text style={styles.unidad}>{producto.unidad}</Text>
            </Text>
            <Pressable style={styles.cantidadBtn} onPress={handleMas}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Campos de detalle */}
        <View style={styles.detallesCard}>
          {producto.categoria && (
            <FilaDetalle icono="grid-outline" label="Categoría" valor={producto.categoria} />
          )}
          {!producto.tieneLotes && producto.mostrarFechaCaducidad !== false && producto.fechaCaducidad && (
            <FilaDetalle icono="calendar-outline" label="Caduca" valor={producto.fechaCaducidad} />
          )}
          {producto.estado !== 'sin_stock' && producto.fechaCompra && (
            <FilaDetalle icono="bag-handle-outline" label="Comprado" valor={producto.fechaCompra} />
          )}
          {producto.notas && (
            <FilaDetalle icono="document-text-outline" label="Notas" valor={producto.notas} />
          )}
          <FilaDetalle
            icono="time-outline"
            label="Actualizado"
            valor={new Date(producto.updatedAt).toLocaleDateString('es-ES')}
          />
        </View>

        {/* Gestión por lotes (siempre activa) */}
        <View style={styles.lotesCard}>
          <View style={styles.lotesHeader}>
            <Text style={styles.lotesTitulo}>Lotes</Text>
          </View>
          <ListaLotes
            lotes={lotesProductoActual}
            onEditar={handleEditarLote}
            onEliminar={handleEliminarLote}
          />
          <Pressable style={styles.btnNuevaCompra} onPress={handleNuevoLote}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.btnNuevaCompraText}>Añadir nueva compra</Text>
          </Pressable>
          {lotesProductoActual.length > 1 && (
            <Pressable style={styles.btnCompactarLotes} onPress={handleCompactarLotes}>
              <Ionicons name="contract-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.btnCompactarLotesText}>Compactar lotes</Text>
            </Pressable>
          )}
        </View>

        {/* Historial de movimientos */}
        {historialProducto.length > 0 && (
          <View style={styles.historialCard}>
            <Text style={styles.historialTitulo}>Historial</Text>
            {historialProducto.map((m) => (
              <FilaHistorial key={m.id} movimiento={m} />
            ))}
          </View>
        )}

        {/* Botón eliminar */}
        <Pressable style={styles.btnEliminar} onPress={handleEliminar}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.btnEliminarText}>Eliminar producto</Text>
        </Pressable>
      </ScrollView>

      {/* Sheet de cantidad (sumar / restar) */}
      <CantidadMotivoSheet
        visible={cantidadSheet}
        unidad={producto.unidad}
        modo={cantidadModo}
        maxCantidad={cantidadModo === 'restar' ? producto.cantidad : undefined}
        aviso={cantidadModo === 'restar' ? avisoRestar : undefined}
        onConfirm={confirmarCantidad}
        onCancelar={() => { setCantidadSheet(false); setLoteObjetivoSuma(null); }}
      />

      {/* Modal para elegir a qué lote añadir cantidad (o crear uno nuevo) */}
      <Modal
        visible={modalElegirLote}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setModalElegirLote(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalElegirLote(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>¿A qué lote añades stock?</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {lotesProductoActual.map((lote) => (
                <LoteCard key={lote.id} lote={lote} onPress={() => handleElegirLoteExistente(lote)} />
              ))}
            </ScrollView>
            <Pressable style={styles.btnNuevaCompra} onPress={handleElegirLoteNuevo}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.btnNuevaCompraText}>Añadir a un lote nuevo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de motivo de eliminación */}
      <Modal
        visible={motivoModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setMotivoModal(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setMotivoModal(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>¿Por qué eliminas este producto?</Text>

            {MOTIVOS.map((m) => (
              <Pressable
                key={m.key}
                style={[styles.motivoBtn, motivoSeleccionado === m.key && styles.motivoBtnActivo]}
                onPress={() => setMotivoSeleccionado(m.key)}
              >
                <Ionicons
                  name={m.icono as any}
                  size={20}
                  color={motivoSeleccionado === m.key ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.motivoBtnText,
                    motivoSeleccionado === m.key && styles.motivoBtnTextActivo,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}

            {motivoSeleccionado === 'otro' && (
              <TextInput
                style={styles.motivoInput}
                placeholder="Describe el motivo (opcional)"
                placeholderTextColor={colors.text.secondary}
                value={motivoDetalleTexto}
                onChangeText={setMotivoDetalleTexto}
                maxLength={200}
              />
            )}

            <View style={styles.modalBotones}>
              <Pressable style={styles.modalBtnCancelar} onPress={() => setMotivoModal(false)}>
                <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnConfirmar, !motivoSeleccionado && styles.modalBtnDisabled]}
                onPress={confirmarEliminacion}
                disabled={!motivoSeleccionado}
              >
                <Text style={styles.modalBtnConfirmarText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de alta/edición de lote */}
      <Modal
        visible={modalLote}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setModalLote(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalLote(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>{loteEditando ? 'Editar lote' : 'Nueva compra'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FormNuevoLote
                loteInicial={loteEditando ?? undefined}
                onGuardar={handleGuardarLote}
                onCancelar={() => setModalLote(false)}
                isLoading={guardandoLote}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilaDetalle({ icono, label, valor }: { icono: string; label: string; valor: string }) {
  return (
    <View style={filaStyles.row}>
      <Ionicons name={icono as any} size={18} color={colors.grayDark} />
      <Text style={filaStyles.label}>{label}</Text>
      <Text style={filaStyles.valor}>{valor}</Text>
    </View>
  );
}

function FilaHistorial({ movimiento }: { movimiento: MovimientoProducto }) {
  const delta =
    movimiento.tipo === 'cantidad_actualizada' &&
    movimiento.cantidadAnterior != null &&
    movimiento.cantidadNueva != null
      ? movimiento.cantidadNueva - movimiento.cantidadAnterior
      : null;

  const icono =
    delta !== null
      ? delta >= 0
        ? { name: 'trending-up-outline' as const, color: colors.primary }
        : { name: 'trending-down-outline' as const, color: colors.error }
      : TIPO_ICONO[movimiento.tipo] ?? { name: 'ellipse-outline', color: colors.grayDark };

  const fecha = new Date(movimiento.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

  return (
    <View style={historialStyles.fila}>
      <Ionicons name={icono.name as any} size={18} color={icono.color} />
      <View style={historialStyles.info}>
        <View style={historialStyles.descRow}>
          <Text style={historialStyles.desc}>{movimiento.descripcion}</Text>
          {delta !== null && (
            <View
              style={[
                historialStyles.deltaChip,
                { backgroundColor: (delta >= 0 ? colors.primary : colors.error) + '20' },
              ]}
            >
              <Text
                style={[
                  historialStyles.deltaText,
                  { color: delta >= 0 ? colors.primary : colors.error },
                ]}
              >
                {delta >= 0 ? `+${delta}` : `${delta}`}
              </Text>
            </View>
          )}
        </View>
        {movimiento.motivo && (
          <Text style={historialStyles.motivo}>
            {movimiento.motivo.replace(/_/g, ' ')}
            {movimiento.motivoDetalle ? ` — ${movimiento.motivoDetalle}` : ''}
          </Text>
        )}
      </View>
      <Text style={historialStyles.fecha}>{fecha}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  noEncontrado: { ...typography.body, color: colors.text.secondary },
  volver: { ...typography.label, color: colors.primary },
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
  headerTitulo: {
    ...typography.heading2,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  badgeRow: { alignItems: 'flex-start' },
  nombre: { ...typography.heading1, color: colors.text.primary, textAlign: 'center' },
  marca: { ...typography.body, color: colors.text.secondary },
  cantidadCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cantidadLabel: { ...typography.label, color: colors.text.secondary },
  cantidadRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  cantidadBtn: {
    backgroundColor: '#E8F5D0',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadBtnDisabled: { backgroundColor: colors.grayLight },
  cantidadValor: {
    ...typography.heading1,
    fontSize: 32,
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  unidad: { ...typography.body, color: colors.text.secondary, fontSize: 16 },
  detallesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historialCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historialTitulo: { ...typography.label, color: colors.text.secondary, marginBottom: spacing.xs },
  lotesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lotesTitulo: { ...typography.label, color: colors.text.secondary },
  btnNuevaCompra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  btnNuevaCompraText: { ...typography.label, color: colors.primary },
  btnCompactarLotes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  btnCompactarLotesText: { ...typography.caption, color: colors.text.secondary },
  btnEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.error,
    marginTop: spacing.sm,
  },
  btnEliminarText: { ...typography.button, color: colors.error },
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
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
    maxHeight: '85%',
  },
  modalTitulo: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
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
    marginTop: spacing.xs,
  },
  modalBotones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtnCancelar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
  },
  modalBtnCancelarText: { ...typography.button, color: colors.text.secondary },
  modalBtnConfirmar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalBtnConfirmarText: { ...typography.button, color: colors.white },
  modalBtnDisabled: { opacity: 0.4 },
});

const filaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  label: { ...typography.caption, color: colors.text.secondary, flex: 1 },
  valor: { ...typography.body, color: colors.text.primary, flexShrink: 1 },
});

const historialStyles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  info: { flex: 1 },
  descRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  desc: { ...typography.body, color: colors.text.primary },
  deltaChip: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: borderRadius.md },
  deltaText: { ...typography.caption, fontWeight: '600' },
  motivo: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  fecha: { ...typography.caption, color: colors.text.secondary, flexShrink: 0 },
});
