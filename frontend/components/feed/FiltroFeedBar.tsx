import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { contarFiltros } from '@/constants/filtrosReceta';
import { useFeedStore } from '@/store/feedStore';
import { colors } from '@/theme/colors';
import { borderRadius } from '@/theme/borderRadius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { FiltrosRecetaSheet } from './FiltrosRecetaSheet';

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
  const filtros = useFeedStore((s) => s.filtros);
  const aplicarFiltros = useFeedStore((s) => s.aplicarFiltros);

  const [sheetVisible, setSheetVisible] = useState(false);
  const totalFiltros = contarFiltros(filtros);

  const handlePress = (filtro: FiltroFeed) => {
    if (filtro === filtroActivo) return;
    onFiltroChange(filtro);
    // "despensa" es un filtro local sobre el feed "para-ti": comparte la misma fuente/paginación.
    cargarFeed(filtro === 'seguidos' ? 'seguidos' : 'para-ti');
  };

  return (
    <View style={styles.barra}>
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

      <Pressable
        style={styles.btnFiltros}
        onPress={() => setSheetVisible(true)}
        hitSlop={8}
        testID="btn-abrir-filtros"
      >
        <Ionicons name="options-outline" size={20} color={colors.primary} />
        {totalFiltros > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{totalFiltros}</Text>
          </View>
        )}
      </Pressable>

      <FiltrosRecetaSheet
        visible={sheetVisible}
        filtros={filtros}
        onCerrar={() => setSheetVisible(false)}
        onAplicar={(nuevos) => {
          setSheetVisible(false);
          void aplicarFiltros(nuevos);
        }}
      />
    </View>
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
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  content: {
    flexGrow: 1,
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
  btnFiltros: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
    fontWeight: '700',
  },
});
