import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useToast } from '@/hooks/useToast';
import { IngredienteConsumo, recetaService } from '@/services/recetaService';
import { handleApiError } from '@/utils/errorHandler';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  visible: boolean;
  recetaId: string;
  numPersonas: number;
  onClose: () => void;
}

const MIN_RACIONES = 0.5;
const PASO_RACIONES = 0.5;

const redondear = (n: number) => Math.round(n * 100) / 100;

export function ModalRecetaRealizada({ visible, recetaId, numPersonas, onClose }: Props) {
  const { showSuccess, showWarning, showError } = useToast();
  const [racionesTexto, setRacionesTexto] = useState(String(numPersonas));
  const [preview, setPreview] = useState<IngredienteConsumo[] | null>(null);
  const [racionesEnPreview, setRacionesEnPreview] = useState<number | null>(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [descontando, setDescontando] = useState(false);

  useEffect(() => {
    if (visible) {
      setRacionesTexto(String(numPersonas));
      setPreview(null);
      setRacionesEnPreview(null);
    }
  }, [visible, numPersonas]);

  const raciones = Math.max(MIN_RACIONES, parseFloat(racionesTexto.replace(',', '.')) || 0);

  const ajustarRaciones = (delta: number) => {
    setRacionesTexto(String(redondear(Math.max(MIN_RACIONES, raciones + delta))));
  };

  // Escala la última preview obtenida del backend según las raciones actuales en vez de
  // repetir la llamada: cantidadCalculada crece linealmente con las raciones elaboradas.
  const previewEscalado = preview && racionesEnPreview
    ? preview.map((item) => {
        const cantidadCalculada = (item.cantidadCalculada / racionesEnPreview) * raciones;
        const suficiente = item.productoEnDespensa && item.cantidadDisponible >= cantidadCalculada;
        return { ...item, cantidadCalculada, suficiente };
      })
    : null;

  const verIngredientes = async () => {
    setCargandoPreview(true);
    try {
      const resultado = await recetaService.marcarRealizada(recetaId, raciones);
      setPreview(resultado);
      setRacionesEnPreview(raciones);
    } catch (e) {
      showError(handleApiError(e));
    } finally {
      setCargandoPreview(false);
    }
  };

  const descontarDeDespensa = async () => {
    setDescontando(true);
    try {
      const resultado = await recetaService.descontarStock(recetaId, raciones);
      const totalDescontados = resultado.descontados.length;
      const totalNoDisponibles = resultado.noDisponibles.length;

      if (totalDescontados > 0) {
        const extra = totalNoDisponibles > 0
          ? ` (${totalNoDisponibles} no encontrado${totalNoDisponibles !== 1 ? 's' : ''} en la despensa)`
          : '';
        showSuccess(
          `${totalDescontados} ingrediente${totalDescontados !== 1 ? 's' : ''} descontado${totalDescontados !== 1 ? 's' : ''} de tu despensa${extra}`
        );
      } else {
        showWarning('Ningún ingrediente estaba disponible en tu despensa');
      }
      onClose();
    } catch (e) {
      showError(handleApiError(e));
    } finally {
      setDescontando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.titulo}>¿Cuántas raciones has preparado?</Text>
          <Text style={styles.subtitulo}>Esta receta es para {numPersonas} personas</Text>

          <View style={styles.racionesRow}>
            <Pressable style={styles.racionesBtn} onPress={() => ajustarRaciones(-PASO_RACIONES)} hitSlop={8}>
              <Ionicons name="remove" size={22} color={colors.primary} />
            </Pressable>
            <TextInput
              style={styles.racionesInput}
              value={racionesTexto}
              onChangeText={setRacionesTexto}
              onBlur={() => setRacionesTexto(String(raciones))}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <Pressable style={styles.racionesBtn} onPress={() => ajustarRaciones(PASO_RACIONES)} hitSlop={8}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.calculoTexto}>Has preparado para {raciones} personas</Text>

          <Pressable style={styles.btnPreview} onPress={verIngredientes} disabled={cargandoPreview}>
            {cargandoPreview ? (
              <ActivityIndicator size="small" color={colors.primaryDark} />
            ) : (
              <Ionicons name="list-outline" size={18} color={colors.primaryDark} />
            )}
            <Text style={styles.btnPreviewText}>Ver ingredientes a descontar</Text>
          </Pressable>

          {previewEscalado && (
            <View style={styles.previewLista}>
              {previewEscalado.map((item) => (
                <FilaIngrediente key={item.nombre} item={item} />
              ))}
            </View>
          )}

          <View style={styles.botonesFinales}>
            <Pressable style={styles.btnCerrar} onPress={onClose}>
              <Text style={styles.btnCerrarText}>Cerrar sin descontar</Text>
            </Pressable>
            <Pressable
              style={[styles.btnDescontar, descontando && styles.btnDisabled]}
              onPress={descontarDeDespensa}
              disabled={descontando}
            >
              {descontando ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.btnDescontarText}>Descontar de despensa</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilaIngrediente({ item }: { item: IngredienteConsumo }) {
  const { color, bg, icono } = !item.productoEnDespensa
    ? { color: colors.grayDark, bg: colors.grayLight, icono: 'help-circle-outline' as const }
    : item.suficiente
      ? { color: colors.primaryDark, bg: '#E8F5D0', icono: 'checkmark-circle-outline' as const }
      : { color: '#B45309', bg: '#FFF3E0', icono: 'warning-outline' as const };

  return (
    <View style={[filaStyles.fila, { backgroundColor: bg }]}>
      <Ionicons name={icono} size={16} color={color} />
      <Text style={[filaStyles.nombre, { color }]} numberOfLines={1}>{item.nombre}</Text>
      <Text style={[filaStyles.cantidad, { color }]}>
        {item.cantidadCalculada.toFixed(2).replace(/\.?0+$/, '')} {item.unidad}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
    maxHeight: '85%',
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitulo: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  racionesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  racionesBtn: {
    backgroundColor: '#E8F5D0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  racionesInput: {
    ...typography.heading1,
    fontSize: 32,
    color: colors.text.primary,
    minWidth: 64,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  calculoTexto: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  btnPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnPreviewText: {
    ...typography.button,
    color: colors.primaryDark,
  },
  previewLista: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  botonesFinales: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnCerrar: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCerrarText: { ...typography.button, color: colors.text.secondary, textAlign: 'center' },
  btnDescontar: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDescontarText: { ...typography.button, color: colors.white, textAlign: 'center' },
  btnDisabled: { opacity: 0.6 },
});

const filaStyles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  nombre: {
    ...typography.body,
    flex: 1,
    fontWeight: '600',
  },
  cantidad: {
    ...typography.caption,
    fontWeight: '600',
  },
});
