import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { ConsumoLote, MotivoEliminacion, Producto } from '@/services/despensaService';
import { LoteProducto, LoteProductoInput } from '@/services/loteService';
import { useDespensaStore } from '@/store/despensaStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CantidadMotivoSheet } from './CantidadMotivoSheet';
import { FormNuevoLote } from './FormNuevoLote';
import { LoteCard } from './LoteCard';

/**
 * Flujo compartido de los botones "+ / -" de cantidad de un producto, idéntico en la lista
 * de la despensa y en el detalle del producto:
 *  - sumar: se elige a qué lote va la cantidad (o se crea una compra nueva);
 *  - restar: se avisa de qué lote se consume primero (FIFO) y, tras confirmar, se muestra
 *    el resumen de lo descontado de cada lote.
 *
 * Los modales viven en <ModalesControlCantidad control={control} />, que se monta una sola
 * vez por pantalla (no una vez por fila de la lista).
 */

interface Opciones {
  /** Se invoca tras cualquier cambio de cantidad aceptado (para refrescar historial, etc.). */
  onCantidadActualizada?: () => void;
}

function formatFechaLote(fecha?: string | null): string {
  if (!fecha) return 'sin fecha';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}

export function useControlCantidadProducto(opciones: Opciones = {}) {
  const { onCantidadActualizada } = opciones;
  const { showError } = useToast();
  const actualizarCantidad = useDespensaStore((s) => s.actualizarCantidad);
  const añadirLote = useDespensaStore((s) => s.añadirLote);
  const editarLote = useDespensaStore((s) => s.editarLote);
  const cargarLotes = useDespensaStore((s) => s.cargarLotes);
  const lotes = useDespensaStore((s) => s.lotesProductoActual);

  const [producto, setProducto] = useState<Producto | null>(null);
  const [modo, setModo] = useState<'sumar' | 'restar'>('restar');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [elegirLoteVisible, setElegirLoteVisible] = useState(false);
  const [nuevoLoteVisible, setNuevoLoteVisible] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [loteObjetivo, setLoteObjetivo] = useState<LoteProducto | null>(null);
  const [aviso, setAviso] = useState<string | undefined>(undefined);

  const abrirRestar = useCallback(
    (p: Producto) => {
      setProducto(p);
      setModo('restar');
      setLoteObjetivo(null);
      setAviso(undefined);
      setSheetVisible(true);
      // Carga el lote más próximo a caducar para avisar de dónde se descuenta primero (FIFO).
      cargarLotes(p.id).then(() => {
        const lote = useDespensaStore.getState().lotesProductoActual[0];
        if (lote) {
          setAviso(
            `Se descontará primero del lote que caduca ${
              lote.fechaCaducidad ? `el ${formatFechaLote(lote.fechaCaducidad)}` : 'antes'
            } (${lote.cantidad} ${lote.unidad}). Si no llega, se sigue por el siguiente.`,
          );
        }
      });
    },
    [cargarLotes],
  );

  const abrirSumar = useCallback(
    (p: Producto) => {
      setProducto(p);
      setModo('sumar');
      setLoteObjetivo(null);
      setElegirLoteVisible(true);
      cargarLotes(p.id);
    },
    [cargarLotes],
  );

  const cancelarSheet = useCallback(() => {
    setSheetVisible(false);
    setLoteObjetivo(null);
    setAviso(undefined);
  }, []);

  const elegirLoteExistente = useCallback((lote: LoteProducto) => {
    setElegirLoteVisible(false);
    setLoteObjetivo(lote);
    setModo('sumar');
    setSheetVisible(true);
  }, []);

  const elegirLoteNuevo = useCallback(() => {
    setElegirLoteVisible(false);
    setNuevoLoteVisible(true);
  }, []);

  const guardarNuevoLote = useCallback(
    async (datos: LoteProductoInput) => {
      if (!producto) return;
      setGuardandoLote(true);
      try {
        await añadirLote(producto.id, datos);
        setNuevoLoteVisible(false);
        onCantidadActualizada?.();
      } catch {
        showError('No se pudo guardar el lote');
      } finally {
        setGuardandoLote(false);
      }
    },
    [producto, añadirLote, onCantidadActualizada, showError],
  );

  const mostrarResumenConsumo = useCallback((consumos: ConsumoLote[], unidad: string) => {
    const lineas = consumos.map((c) => {
      const linea = `Lote del ${formatFechaLote(c.fechaCaducidad)}: -${c.cantidadConsumida} ${unidad}`;
      return c.loteEliminado ? `${linea} (agotado)` : `${linea} · quedan ${c.cantidadRestante}`;
    });
    showConfirm('Consumido de tus lotes', lineas.join('\n'), undefined, { icon: 'layers-outline' });
  }, []);

  const confirmarCantidad = useCallback(
    async (cantidad: number, motivo?: MotivoEliminacion, motivoDetalle?: string) => {
      if (!producto) return;
      const p = producto;
      setSheetVisible(false);

      // Sumar a un lote ya elegido: no se toca la cantidad del producto directamente, se
      // recalcula sola a partir del lote actualizado.
      if (modo === 'sumar' && loteObjetivo) {
        const lote = loteObjetivo;
        setLoteObjetivo(null);
        try {
          await editarLote(p.id, lote.id, {
            cantidad: lote.cantidad + cantidad,
            unidad: lote.unidad,
            fechaCaducidad: lote.fechaCaducidad,
            fechaCompra: lote.fechaCompra,
            origen: lote.origen,
          });
          onCantidadActualizada?.();
        } catch {
          showError('No se pudo actualizar el lote');
        }
        return;
      }

      const delta = modo === 'sumar' ? cantidad : -cantidad;
      try {
        const actualizado = await actualizarCantidad(p.id, delta, motivo, motivoDetalle);
        onCantidadActualizada?.();
        if (actualizado?.consumosFifo && actualizado.consumosFifo.length > 0) {
          mostrarResumenConsumo(actualizado.consumosFifo, p.unidad);
        }
      } catch {
        showError('No puedes quitar más cantidad de la que tienes disponible');
      }
    },
    [producto, modo, loteObjetivo, editarLote, actualizarCantidad, onCantidadActualizada, mostrarResumenConsumo, showError],
  );

  return {
    producto,
    modo,
    sheetVisible,
    elegirLoteVisible,
    nuevoLoteVisible,
    guardandoLote,
    aviso,
    lotes: lotes ?? [],
    abrirSumar,
    abrirRestar,
    cancelarSheet,
    elegirLoteExistente,
    elegirLoteNuevo,
    guardarNuevoLote,
    confirmarCantidad,
    cerrarElegirLote: () => setElegirLoteVisible(false),
    cerrarNuevoLote: () => setNuevoLoteVisible(false),
  };
}

export type ControlCantidad = ReturnType<typeof useControlCantidadProducto>;

export function ModalesControlCantidad({ control }: { control: ControlCantidad }) {
  const { producto, modo } = control;

  return (
    <>
      <CantidadMotivoSheet
        visible={control.sheetVisible}
        unidad={producto?.unidad ?? ''}
        modo={modo}
        maxCantidad={modo === 'restar' ? producto?.cantidad : undefined}
        aviso={modo === 'restar' ? control.aviso : undefined}
        onConfirm={control.confirmarCantidad}
        onCancelar={control.cancelarSheet}
      />

      {/* Elegir a qué lote se añade la cantidad (o crear una compra nueva) */}
      <Modal
        visible={control.elegirLoteVisible}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={control.cerrarElegirLote}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={control.cerrarElegirLote} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>¿A qué lote añades stock?</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {control.lotes.map((lote) => (
                <LoteCard key={lote.id} lote={lote} onPress={() => control.elegirLoteExistente(lote)} />
              ))}
            </ScrollView>
            <Pressable style={styles.btnNuevaCompra} onPress={control.elegirLoteNuevo}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.btnNuevaCompraText}>Añadir a un lote nuevo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Alta de un lote nuevo */}
      <Modal
        visible={control.nuevoLoteVisible}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={control.cerrarNuevoLote}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={control.cerrarNuevoLote} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitulo}>Nueva compra</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FormNuevoLote
                onGuardar={control.guardarNuevoLote}
                onCancelar={control.cerrarNuevoLote}
                isLoading={control.guardandoLote}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
});
