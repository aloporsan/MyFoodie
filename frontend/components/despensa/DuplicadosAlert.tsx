import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Producto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  visible: boolean;
  duplicados: Producto[];
  onAñadirIgualmente: () => void;
  onActualizarExistente: (producto: Producto) => void;
  onCancelar: () => void;
}

export function DuplicadosAlert({
  visible,
  duplicados,
  onAñadirIgualmente,
  onActualizarExistente,
  onCancelar,
}: Props) {
  const primerDuplicado = duplicados[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable style={styles.overlay} onPress={onCancelar}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconRow}>
            <Ionicons name="warning-outline" size={24} color={colors.secondary} />
          </View>

          <Text style={styles.titulo}>Producto similar detectado</Text>
          <Text style={styles.subtitulo}>
            Ya tienes &quot;{primerDuplicado?.nombre}&quot; en tu despensa
            {primerDuplicado ? ` (${primerDuplicado.cantidad} ${primerDuplicado.unidad})` : ''}.
          </Text>

          <Pressable style={styles.btnPrimario} onPress={onAñadirIgualmente}>
            <Text style={styles.btnPrimarioText}>Añadir igualmente</Text>
          </Pressable>

          {primerDuplicado && (
            <Pressable
              style={styles.btnSecundario}
              onPress={() => onActualizarExistente(primerDuplicado)}
            >
              <Text style={styles.btnSecundarioText}>
                Actualizar cantidad del existente
              </Text>
            </Pressable>
          )}

          <Pressable style={styles.btnCancelar} onPress={onCancelar}>
            <Text style={styles.btnCancelarText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitulo: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  btnPrimario: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnPrimarioText: {
    ...typography.button,
    color: colors.white,
  },
  btnSecundario: {
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnSecundarioText: {
    ...typography.button,
    color: colors.text.primary,
  },
  btnCancelar: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnCancelarText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
