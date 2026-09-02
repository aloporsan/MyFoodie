import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ETIQUETAS_SUGERIDAS } from '@/constants/etiquetas';
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
  const filtrarPorEtiqueta = useFeedStore((s) => s.filtrarPorEtiqueta);
  const etiquetaSeleccionada = useFeedStore((s) => s.etiquetaSeleccionada);

  const handlePress = (filtro: FiltroFeed) => {
    if (filtro === filtroActivo) return;
    onFiltroChange(filtro);
    // "despensa" es un filtro local sobre el feed "para-ti": comparte la misma fuente/paginación.
    cargarFeed(filtro === 'seguidos' ? 'seguidos' : 'para-ti');
  };

  const handleEtiquetaPress = (etiqueta: string) => {
    const nueva = etiqueta === etiquetaSeleccionada ? null : etiqueta;
    // El filtro por etiqueta se sirve desde el feed "para-ti"; si veníamos de "seguidos" cambiamos.
    if (nueva && filtroActivo === 'seguidos') {
      onFiltroChange('para-ti');
    }
    void filtrarPorEtiqueta(nueva);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      testID="filtro-feed-bar"
    >
      {FILTROS.map((filtro) => (
        <Chip
          key={filtro.id}
          label={filtro.label}
          activo={filtro.id === filtroActivo}
          onPress={() => handlePress(filtro.id)}
          testID={`filtro-chip-${filtro.id}`}
        />
      ))}

      <View style={styles.separador} />

      {ETIQUETAS_SUGERIDAS.map((etiqueta) => (
        <Chip
          key={etiqueta}
          label={etiqueta}
          activo={etiqueta === etiquetaSeleccionada}
          onPress={() => handleEtiquetaPress(etiqueta)}
          testID={`filtro-etiqueta-${etiqueta}`}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  activo,
  onPress,
  testID,
}: {
  label: string;
  activo: boolean;
  onPress: () => void;
  testID?: string;
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
    <Pressable onPress={onPress} testID={testID}>
      <Animated.View style={[styles.chip, { backgroundColor }]}>
        <Animated.Text style={[styles.chipTexto, { color }]}>{label}</Animated.Text>
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
    alignItems: 'center',
  },
  separador: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
    backgroundColor: colors.gray,
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
