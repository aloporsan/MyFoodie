import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MotivoEliminacion } from '@/services/despensaService';
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

interface Props {
  visible: boolean;
  unidad: string;
  /** 'sumar' = añadir stock, 'restar' = consumir/gastar */
  modo: 'sumar' | 'restar';
  /** Cantidad disponible en despensa. Al restar, no se puede pedir más de esto. */
  maxCantidad?: number;
  /** Aviso informativo opcional (p. ej. qué lote se va a consumir primero). */
  aviso?: string;
  onConfirm: (cantidad: number, motivo?: MotivoEliminacion, motivoDetalle?: string) => void;
  onCancelar: () => void;
}

export function CantidadMotivoSheet({ visible, unidad, modo, maxCantidad, aviso, onConfirm, onCancelar }: Props) {
  const [cantidadTexto, setCantidadTexto] = useState('1');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoEliminacion | null>(null);
  const [motivoDetalleTexto, setMotivoDetalleTexto] = useState('');

  const esRestar = modo === 'restar';
  const limite = esRestar && maxCantidad != null ? maxCantidad : Infinity;
  const cantidad = Math.min(limite, Math.max(1, parseInt(cantidadTexto, 10) || 1));
  const puedeConfirmar = !esRestar || motivoSeleccionado !== null;

  const handleConfirm = () => {
    const detalle =
      motivoSeleccionado === 'otro' && motivoDetalleTexto.trim()
        ? motivoDetalleTexto.trim()
        : undefined;
    onConfirm(cantidad, esRestar ? (motivoSeleccionado ?? undefined) : undefined, detalle);
    reset();
  };

  const handleCancelar = () => {
    reset();
    onCancelar();
  };

  const reset = () => {
    setCantidadTexto('1');
    setMotivoSeleccionado(null);
    setMotivoDetalleTexto('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={handleCancelar}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleCancelar} />
        <View style={styles.sheet}>
          <Text style={styles.titulo}>
            {esRestar ? '¿Cuánto has usado?' : '¿Cuánto añades?'}
          </Text>

          {aviso && (
            <View style={styles.avisoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.avisoText}>{aviso}</Text>
            </View>
          )}

          {/* Input de cantidad */}
          <View style={styles.cantidadRow}>
            <Pressable
              style={styles.cantidadBtn}
              onPress={() => setCantidadTexto(String(Math.max(1, cantidad - 1)))}
            >
              <Ionicons name="remove" size={22} color={colors.primary} />
            </Pressable>
            <TextInput
              style={styles.cantidadInput}
              keyboardType="numeric"
              value={cantidadTexto}
              onChangeText={(t) => {
                const soloDigitos = t.replace(/[^0-9]/g, '');
                if (soloDigitos === '') {
                  setCantidadTexto('');
                  return;
                }
                const parsed = parseInt(soloDigitos, 10);
                setCantidadTexto(String(Math.min(limite, parsed)));
              }}
              onBlur={() => setCantidadTexto(String(Math.min(limite, Math.max(1, parseInt(cantidadTexto, 10) || 1))))}
              selectTextOnFocus
            />
            <Text style={styles.unidadText}>{unidad}</Text>
            <Pressable
              style={[styles.cantidadBtn, cantidad >= limite && styles.cantidadBtnDisabled]}
              onPress={() => setCantidadTexto(String(Math.min(limite, cantidad + 1)))}
              disabled={cantidad >= limite}
            >
              <Ionicons name="add" size={22} color={cantidad >= limite ? colors.grayDark : colors.primary} />
            </Pressable>
          </View>
          {esRestar && maxCantidad != null && (
            <Text style={styles.maxHint}>Disponible: {maxCantidad} {unidad}</Text>
          )}

          {/* Selector de motivo — solo al restar */}
          {esRestar && (
            <>
              <Text style={styles.motivoLabel}>¿Por qué?</Text>
              {MOTIVOS.map((m) => (
                <Pressable
                  key={m.key}
                  style={[styles.motivoBtn, motivoSeleccionado === m.key && styles.motivoBtnActivo]}
                  onPress={() => setMotivoSeleccionado(m.key)}
                >
                  <Ionicons
                    name={m.icono as any}
                    size={18}
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
            </>
          )}

          <View style={styles.botones}>
            <Pressable style={styles.btnCancelar} onPress={handleCancelar}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.btnConfirmar, !puedeConfirmar && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={!puedeConfirmar}
            >
              <Text style={styles.btnConfirmarText}>
                {esRestar ? 'Registrar uso' : 'Añadir'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cantidadBtn: {
    backgroundColor: '#E8F5D0',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadInput: {
    ...typography.heading1,
    fontSize: 28,
    color: colors.text.primary,
    textAlign: 'center',
    minWidth: 60,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  unidadText: {
    ...typography.body,
    color: colors.text.secondary,
    minWidth: 40,
  },
  cantidadBtnDisabled: { backgroundColor: colors.grayLight },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  avisoText: { ...typography.caption, color: colors.text.secondary, flex: 1 },
  maxHint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  motivoLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  motivoBtnActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
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
  botones: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
  },
  btnCancelarText: { ...typography.button, color: colors.text.secondary },
  btnConfirmar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnConfirmarText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
