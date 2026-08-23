import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  cantidad: number;
  onRevisar: () => void;
}

const COLOR_FONDO_ICONO = '#FFF3E0';

export function AlertaDuplicados({ cantidad, onRevisar }: Props) {
  const [cerrado, setCerrado] = useState(false);

  if (cerrado || cantidad <= 0) {
    return null;
  }

  const plural = cantidad === 1 ? '' : 's';

  return (
    <Pressable style={styles.card} onPress={onRevisar}>
      <Pressable onPress={() => setCerrado(true)} hitSlop={8} style={styles.btnCerrar} testID="alerta-duplicados-cerrar">
        <Ionicons name="close" size={16} color={colors.text.secondary} />
      </Pressable>

      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="information-circle" size={22} color={colors.secondary} />
        </View>

        <View style={styles.info}>
          <Text style={styles.titulo}>Posibles duplicados</Text>
          <Text style={styles.texto}>
            Hemos detectado {cantidad} producto{plural} que podría{plural} ser el mismo
          </Text>
        </View>
      </View>

      <View style={styles.btnRevisar}>
        <Text style={styles.btnRevisarTexto}>Revisar</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  btnCerrar: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR_FONDO_ICONO,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  titulo: { ...typography.label, color: colors.text.primary },
  texto: { ...typography.caption, color: colors.text.secondary },
  btnRevisar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  btnRevisarTexto: {
    ...typography.label,
    color: colors.secondary,
    fontWeight: '700',
  },
});
