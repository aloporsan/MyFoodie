import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Producto } from '@/services/despensaService';
import { ParDuplicado } from '@/services/matchingService';
import { useFusionStore } from '@/store/fusionStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { convertirCantidad } from '@/utils/unidadConfig';

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

const formatFecha = (fecha?: string): string => {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
};

export function ModalFusion({ visible, par, onClose }: Props) {
  const { fusionarProductos, isLoading } = useFusionStore();
  const [conservarA, setConservarA] = useState(true);
  const [unidadOverrideA, setUnidadOverrideA] = useState<boolean | null>(null);
  const [fechaOverrideA, setFechaOverrideA] = useState<boolean | null>(null);

  useEffect(() => {
    if (!par) return;
    setConservarA(true);
    setUnidadOverrideA(null);
    setFechaOverrideA(null);
  }, [par?.productoA.id, par?.productoB.id]);

  if (!par) {
    return null;
  }

  const mantener: Producto = conservarA ? par.productoA : par.productoB;
  const eliminar: Producto = conservarA ? par.productoB : par.productoA;

  const unidadesDifieren = par.productoA.unidad !== par.productoB.unidad;
  const fechasDifieren =
    (par.productoA.fechaCaducidad ?? null) !== (par.productoB.fechaCaducidad ?? null);

  const usarUnidadA = unidadOverrideA ?? conservarA;
  const usarFechaA = fechaOverrideA ?? conservarA;

  const unidadFinal = unidadesDifieren
    ? (usarUnidadA ? par.productoA.unidad : par.productoB.unidad)
    : mantener.unidad;
  const fechaFinal = fechasDifieren
    ? (usarFechaA ? par.productoA.fechaCaducidad : par.productoB.fechaCaducidad)
    : fechaMasProxima(par.productoA.fechaCaducidad, par.productoB.fechaCaducidad);

  // Convierte ambas cantidades a la unidad resultante antes de sumar (2 l + 500 ml = 2.5 l, no "502 l").
  // Si las unidades no son de la misma familia, convertirCantidad devuelve null y sumamos en crudo.
  const cantidadA = convertirCantidad(par.productoA.cantidad, par.productoA.unidad, unidadFinal) ?? par.productoA.cantidad;
  const cantidadB = convertirCantidad(par.productoB.cantidad, par.productoB.unidad, unidadFinal) ?? par.productoB.cantidad;
  const cantidadTotal = cantidadA + cantidadB;

  const handleFusionar = async () => {
    try {
      await fusionarProductos(
        mantener.id,
        eliminar.id,
        unidadesDifieren ? unidadFinal : undefined,
        fechasDifieren ? fechaFinal : undefined
      );
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
              <Text style={styles.opcionNombre}>{par.productoA.nombre}</Text>
              <Text style={styles.opcionCantidad}>
                {par.productoA.cantidad} {par.productoA.unidad}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.opcion, !conservarA && styles.opcionSeleccionada]}
              onPress={() => setConservarA(false)}
            >
              <Text style={styles.opcionNombre}>{par.productoB.nombre}</Text>
              <Text style={styles.opcionCantidad}>
                {par.productoB.cantidad} {par.productoB.unidad}
              </Text>
            </Pressable>
          </View>

          {unidadesDifieren && (
            <View style={styles.bloque}>
              <Text style={styles.pregunta}>¿Qué unidad quieres usar?</Text>
              <View style={styles.chips}>
                <Chip
                  label={par.productoA.unidad}
                  activo={usarUnidadA}
                  onPress={() => setUnidadOverrideA(true)}
                />
                <Chip
                  label={par.productoB.unidad}
                  activo={!usarUnidadA}
                  onPress={() => setUnidadOverrideA(false)}
                />
              </View>
            </View>
          )}

          {fechasDifieren && (
            <View style={styles.bloque}>
              <Text style={styles.pregunta}>¿Qué fecha de caducidad quieres conservar?</Text>
              <View style={styles.chips}>
                <Chip
                  label={par.productoA.fechaCaducidad ? formatFecha(par.productoA.fechaCaducidad) : 'Sin fecha'}
                  activo={usarFechaA}
                  onPress={() => setFechaOverrideA(true)}
                />
                <Chip
                  label={par.productoB.fechaCaducidad ? formatFecha(par.productoB.fechaCaducidad) : 'Sin fecha'}
                  activo={!usarFechaA}
                  onPress={() => setFechaOverrideA(false)}
                />
              </View>
            </View>
          )}

          <View style={styles.preview}>
            <Text style={styles.previewTexto}>
              El producto resultante tendrá {cantidadTotal} {unidadFinal}
              {fechaFinal ? ` y caducará el ${formatFecha(fechaFinal)}` : ''}.
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

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable style={[chipStyles.chip, activo && chipStyles.chipActivo]} onPress={onPress}>
      <Text style={[chipStyles.texto, activo && chipStyles.textoActivo]}>{label}</Text>
    </Pressable>
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
  bloque: { marginBottom: spacing.md },
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
  chips: { flexDirection: 'row', gap: spacing.sm },
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

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.gray,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  chipActivo: { borderColor: colors.primary, backgroundColor: '#E8F5D0' },
  texto: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  textoActivo: { color: colors.primaryDark },
});
