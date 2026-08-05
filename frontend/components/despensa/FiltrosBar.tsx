import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EstadoProducto } from '@/services/despensaService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type FiltroId = 'todos' | EstadoProducto;

interface Chip {
  id: FiltroId;
  label: string;
  color?: string;
}

const ESTADO_CHIPS: Record<EstadoProducto, Chip> = {
  sin_stock:     { id: 'sin_stock',     label: 'Sin stock',     color: '#616161' },
  caducado:      { id: 'caducado',      label: 'Caducados',     color: colors.error },
  caduca_hoy:    { id: 'caduca_hoy',    label: 'Caduca hoy',    color: '#FF6D00' },
  caduca_pronto: { id: 'caduca_pronto', label: 'Caduca pronto', color: colors.secondary },
  caduca_semana: { id: 'caduca_semana', label: 'Esta semana',   color: '#FDD835' },
  caduca_mes:    { id: 'caduca_mes',    label: 'Este mes',      color: '#DCE775' },
  bajoStock:     { id: 'bajoStock',     label: 'Bajo stock',    color: '#F5D800' },
  normal:        { id: 'normal',        label: 'En stock',      color: colors.primary },
};

const ORDEN_ACTIVO_COLOR = '#7FC62A';

interface OrdenOpcion {
  id: string;
  label: string;
  icono: React.ComponentProps<typeof FontAwesome>['name'];
}

const ORDEN_OPCIONES: OrdenOpcion[] = [
  { id: 'nombre_asc',       label: 'Nombre A-Z',     icono: 'sort-alpha-asc' },
  { id: 'nombre_desc',      label: 'Nombre Z-A',     icono: 'sort-alpha-desc' },
  { id: 'caducidad_asc',    label: 'Caduca antes',   icono: 'calendar' },
  { id: 'cantidad_desc',    label: 'Más cantidad',   icono: 'arrow-up' },
  { id: 'cantidad_asc',     label: 'Menos cantidad', icono: 'arrow-down' },
  { id: 'reciente_primero', label: 'Más reciente',   icono: 'clock-o' },
  { id: 'categoria',        label: 'Por categoría',  icono: 'tag' },
];

interface Props {
  filtroActivo: FiltroId | string;
  estadosPresentes: EstadoProducto[];
  onFiltroChange: (filtro: FiltroId) => void;
  ordenActivo?: string;
  onOrdenChange?: (orden: string) => void;
}

export function FiltrosBar({
  filtroActivo,
  estadosPresentes,
  onFiltroChange,
  ordenActivo = 'reciente_primero',
  onOrdenChange,
}: Props) {
  const chips: Chip[] = [
    { id: 'todos', label: 'Todos' },
    ...estadosPresentes
      .filter((e) => e !== 'normal')
      .map((e) => ESTADO_CHIPS[e]),
  ];

  const mostrarEstados = chips.length > 1;

  return (
    <View style={styles.wrapper}>
      {mostrarEstados && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {chips.map((chip) => {
            const activo = filtroActivo === chip.id;
            const accentColor = chip.color ?? colors.primary;
            return (
              <Pressable
                key={chip.id}
                style={[
                  styles.chip,
                  activo && { backgroundColor: accentColor + '22', borderColor: accentColor },
                ]}
                onPress={() => onFiltroChange(chip.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    activo && { color: accentColor, fontWeight: '700' },
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {ORDEN_OPCIONES.map((opcion) => {
          const activo = ordenActivo === opcion.id;
          return (
            <Pressable
              key={opcion.id}
              style={[
                styles.chip,
                activo && { backgroundColor: ORDEN_ACTIVO_COLOR + '22', borderColor: ORDEN_ACTIVO_COLOR },
              ]}
              onPress={() => onOrdenChange?.(opcion.id)}
            >
              <FontAwesome
                name={opcion.icono}
                size={12}
                color={activo ? ORDEN_ACTIVO_COLOR : colors.text.secondary}
                style={styles.ordenIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  activo && { color: ORDEN_ACTIVO_COLOR, fontWeight: '700' },
                ]}
              >
                {opcion.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  ordenIcon: {
    marginRight: 6,
  },
});
