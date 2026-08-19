import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFeedStore } from '@/store/feedStore';
import { colors } from '@/theme/colors';
import { borderRadius } from '@/theme/borderRadius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type FiltroFeed = 'para-ti' | 'seguidos' | 'despensa';

interface FiltroOpcion {
  id: FiltroFeed;
  label: string;
}

const FILTROS: FiltroOpcion[] = [
  { id: 'para-ti', label: 'Para ti' },
  { id: 'seguidos', label: 'Seguidos' },
  { id: 'despensa', label: 'Despensa' },
];

const DURACION_ANIMACION = 200;

interface FiltroFeedBarProps {
  filtroActivo: FiltroFeed;
  onFiltroChange: (filtro: FiltroFeed) => void;
}

export function FiltroFeedBar({ filtroActivo, onFiltroChange }: FiltroFeedBarProps) {
  const cargarFeed = useFeedStore((s) => s.cargarFeed);

  const handlePress = (filtro: FiltroFeed) => {
    if (filtro === filtroActivo) return;
    onFiltroChange(filtro);
    // "despensa" es un filtro local sobre el feed "para-ti": comparte la misma fuente/paginación.
    cargarFeed(filtro === 'seguidos' ? 'seguidos' : 'para-ti');
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      testID="filtro-feed-bar"
    >
      {FILTROS.map((filtro) => (
        <FiltroChip
          key={filtro.id}
          filtro={filtro}
          activo={filtro.id === filtroActivo}
          onPress={() => handlePress(filtro.id)}
        />
      ))}
    </ScrollView>
  );
}

function FiltroChip({
  filtro,
  activo,
  onPress,
}: {
  filtro: FiltroOpcion;
  activo: boolean;
  onPress: () => void;
}) {
  const progreso = useRef(new Animated.Value(activo ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: activo ? 1 : 0,
      duration: DURACION_ANIMACION,
      useNativeDriver: false,
    }).start();
  }, [activo, progreso]);

  const backgroundColor = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.grayLight, colors.primary],
  });
  const color = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text.secondary, colors.white],
  });

  return (
    <Pressable onPress={onPress} testID={`filtro-chip-${filtro.id}`}>
      <Animated.View style={[styles.chip, { backgroundColor }]}>
        <Animated.Text style={[styles.chipTexto, { color }]}>{filtro.label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  chipTexto: {
    ...typography.label,
    fontWeight: '700',
  },
});
