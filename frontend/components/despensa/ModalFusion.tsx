import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Producto } from '@/services/despensaService';
import { ParDuplicado } from '@/services/matchingService';
import { useFusionStore } from '@/store/fusionStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  visible: boolean;
  par: ParDuplicado | null;
  onClose: () => void;
}

const fechaMasProxima = (a?: string, b?: string): string | undefined => {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
};

export function ModalFusion({ visible, par, onClose }: Props) {
  const { fusionarProductos, isLoading } = useFusionStore();
  const [conservarA, setConservarA] = useState(true);

  if (!par) {
    return null;
  }

  const mantener: Producto = conservarA ? par.productoA : par.productoB;
  const eliminar: Producto = conservarA ? par.productoB : par.productoA;
  const cantidadTotal = par.productoA.cantidad + par.productoB.cantidad;
  const caducidad = fechaMasProxima(par.productoA.fechaCaducidad, par.productoB.fechaCaducidad);

  const handleFusionar = async () => {
    try {
      await fusionarProductos(mantener.id, eliminar.id);
      onClose();
    } catch {
      // el error queda reflejado en fusionStore.error
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.titulo}>Fusionar productos</Text>

          <Text style={styles.pregunta}>¿Cuál quieres conservar?</Text>
          <View style={styles.opciones}>
            <Pressable
              style={[styles.opcion, conservarA && styles.opcionSeleccionada]}
              onPress={() => setConservarA(true)}
            >
              <Text style={styles.opcionNombre} numberOfLines={1}>
                {par.productoA.nombre}
              </Text>
              <Text style={styles.opcionCantidad}>
                {par.productoA.cantidad} {par.productoA.unidad}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.opcion, !conservarA && styles.opcionSeleccionada]}
              onPress={() => setConservarA(false)}
            >
              <Text style={styles.opcionNombre} numberOfLines={1}>
                {par.productoB.nombre}
              </Text>
              <Text style={styles.opcionCantidad}>
                {par.productoB.cantidad} {par.productoB.unidad}
              </Text>
            </Pressable>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewTexto}>
              El producto resultante tendrá {cantidadTotal} {mantener.unidad}
              {caducidad ? ` y caducará el ${caducidad}` : ''}.
            </Text>
          </View>

          <View style={styles.botones}>
            <Pressable style={styles.btnCancelar} onPress={onClose}>
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btnFusionar, isLoading && styles.btnDeshabilitado]}
              onPress={handleFusionar}
              disabled={isLoading}
            >
              <Text style={styles.btnFusionarTexto}>
                {isLoading ? 'Fusionando…' : 'Fusionar'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
  titulo: {
    ...typography.heading3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pregunta: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  opciones: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  opcion: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  opcionSeleccionada: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5D0',
  },
  opcionNombre: { ...typography.label, color: colors.text.primary },
  opcionCantidad: { ...typography.caption, color: colors.text.secondary },
  preview: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  previewTexto: { ...typography.body, color: colors.text.secondary },
  botones: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnCancelar: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnCancelarTexto: { ...typography.button, color: colors.text.secondary },
  btnFusionar: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDeshabilitado: { opacity: 0.6 },
  btnFusionarTexto: { ...typography.button, color: colors.white },
});
