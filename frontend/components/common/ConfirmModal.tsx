import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfirmButton, ConfirmVariant, useConfirmStore } from '@/hooks/useConfirm';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const VARIANT_COLOR: Record<ConfirmVariant, string> = {
  default: colors.primary,
  danger: colors.error,
  warning: colors.secondary,
};

const VARIANT_BG: Record<ConfirmVariant, string> = {
  default: '#E8F5D0',
  danger: '#FFEBEE',
  warning: '#FFF8E1',
};

export function ConfirmModal() {
  const { visible, title, message, icon, variant, buttons, hide } = useConfirmStore();

  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const apilados = buttons.length > 2;

  const handlePress = (btn: ConfirmButton) => {
    hide();
    btn.onPress?.();
  };

  const handleDismiss = () => {
    if (cancelButton) handlePress(cancelButton);
    else hide();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      testID="confirm-modal"
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {icon ? (
            <View style={[styles.iconWrapper, { backgroundColor: VARIANT_BG[variant] }]}>
              <Ionicons name={icon as any} size={26} color={VARIANT_COLOR[variant]} />
            </View>
          ) : null}
          <Text style={styles.titulo}>{title}</Text>
          {message ? <Text style={styles.mensaje}>{message}</Text> : null}
          <View style={[styles.botones, apilados && styles.botonesApilados]}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                testID={`confirm-modal-btn-${i}`}
                style={[
                  styles.boton,
                  !apilados && styles.botonEnFila,
                  btn.style === 'cancel' && styles.botonCancelar,
                  btn.style === 'destructive' && styles.botonDestructivo,
                ]}
                onPress={() => handlePress(btn)}
              >
                <Text
                  style={[
                    styles.botonTexto,
                    btn.style === 'cancel' && styles.botonTextoCancelar,
                    btn.style === 'destructive' && styles.botonTextoDestructivo,
                  ]}
                >
                  {btn.text}
                </Text>
              </Pressable>
            ))}
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
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
  mensaje: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  botonesApilados: { flexDirection: 'column' },
  boton: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  botonEnFila: { flex: 1 },
  botonCancelar: { backgroundColor: colors.grayLight },
  botonDestructivo: { backgroundColor: colors.error },
  botonTexto: { ...typography.button, color: colors.white },
  botonTextoCancelar: { color: colors.text.secondary },
  botonTextoDestructivo: { color: colors.white },
});
