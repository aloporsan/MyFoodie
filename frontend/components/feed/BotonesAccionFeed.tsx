import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface BotonesAccionFeedProps {
  yaLike: boolean;
  yaGuardada: boolean;
  onDescartar: () => void;
  onDeshacer: () => void;
  onLike: () => void;
  onGuardar: () => void;
}

type BotonId = 'descartar' | 'deshacer' | 'like' | 'guardar';

const TOOLTIPS: Record<BotonId, string> = {
  descartar: 'Descartar',
  deshacer: 'Deshacer',
  like: 'Me gusta',
  guardar: 'Guardar',
};

export function BotonesAccionFeed({
  yaLike,
  yaGuardada,
  onDescartar,
  onDeshacer,
  onLike,
  onGuardar,
}: BotonesAccionFeedProps) {
  const [tooltip, setTooltip] = useState<BotonId | null>(null);

  const mostrarTooltip = (id: BotonId) => {
    setTooltip(id);
    setTimeout(() => setTooltip((actual) => (actual === id ? null : actual)), 1500);
  };

  return (
    <View style={styles.container}>
      <BotonAccion
        id="descartar"
        icono="close"
        color={colors.grayDark}
        fondo={colors.grayLight}
        tooltipVisible={tooltip === 'descartar'}
        onPress={onDescartar}
        onLongPress={() => mostrarTooltip('descartar')}
      />
      <BotonAccion
        id="deshacer"
        icono="arrow-undo"
        color={colors.white}
        fondo="#2196F3"
        tooltipVisible={tooltip === 'deshacer'}
        onPress={onDeshacer}
        onLongPress={() => mostrarTooltip('deshacer')}
      />
      <BotonAccion
        id="like"
        icono={yaLike ? 'heart' : 'heart-outline'}
        color={yaLike ? colors.white : colors.grayDark}
        fondo={yaLike ? colors.error : colors.grayLight}
        tooltipVisible={tooltip === 'like'}
        onPress={onLike}
        onLongPress={() => mostrarTooltip('like')}
      />
      <BotonAccion
        id="guardar"
        icono={yaGuardada ? 'bookmark' : 'bookmark-outline'}
        color={yaGuardada ? colors.white : colors.grayDark}
        fondo={yaGuardada ? colors.primary : colors.grayLight}
        tooltipVisible={tooltip === 'guardar'}
        onPress={onGuardar}
        onLongPress={() => mostrarTooltip('guardar')}
      />
    </View>
  );
}

interface BotonAccionProps {
  id: BotonId;
  icono: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  fondo: string;
  tooltipVisible: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function BotonAccion({ id, icono, color, fondo, tooltipVisible, onPress, onLongPress }: BotonAccionProps) {
  return (
    <View style={styles.botonWrapper}>
      {tooltipVisible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTexto}>{TOOLTIPS[id]}</Text>
        </View>
      )}
      <Pressable
        style={[styles.boton, { backgroundColor: fondo }]}
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={4}
        accessibilityLabel={TOOLTIPS[id]}
      >
        <Ionicons name={icono} size={26} color={color} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  botonWrapper: {
    alignItems: 'center',
  },
  boton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -32,
    backgroundColor: colors.text.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  tooltipTexto: {
    ...typography.caption,
    color: colors.white,
  },
});
