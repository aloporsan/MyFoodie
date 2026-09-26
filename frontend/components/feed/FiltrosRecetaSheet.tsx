import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  alternarValor,
  CATEGORIAS_RECETA,
  contarFiltros,
  DIFICULTADES_RECETA,
  ETIQUETAS_RECETA,
  FILTROS_RECETA_VACIOS,
  FiltrosReceta,
  PERSONAS_RECETA,
  TIEMPOS_RECETA,
} from '@/constants/filtrosReceta';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  visible: boolean;
  filtros: FiltrosReceta;
  onAplicar: (filtros: FiltrosReceta) => void;
  onCerrar: () => void;
  /** Muestra el switch "solo lo que puedo cocinar" (buscador; en el feed ya está la pestaña Despensa). */
  mostrarDespensa?: boolean;
}

export function FiltrosRecetaSheet({ visible, filtros, onAplicar, onCerrar, mostrarDespensa }: Props) {
  const insets = useSafeAreaInsets();
  const [borrador, setBorrador] = useState<FiltrosReceta>(filtros);

  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  const toggle = (clave: 'categorias' | 'dificultades' | 'etiquetas' | 'tiempos' | 'personas', valor: string) => {
    setBorrador((b) => ({ ...b, [clave]: alternarValor(b[clave], valor) }));
  };

  const total = contarFiltros(borrador);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCerrar} testID="filtros-overlay" />

        <View style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}>
          <View style={styles.handle} />

          <View style={styles.cabecera}>
            <Text style={styles.titulo}>Filtrar recetas</Text>
            {total > 0 && (
              <View style={styles.contadorPill}>
                <Text style={styles.contadorPillTexto}>{total}</Text>
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {mostrarDespensa && (
              <Pressable
                style={styles.despensaCard}
                onPress={() => setBorrador((b) => ({ ...b, soloDespensa: !b.soloDespensa }))}
                testID="filtro-solo-despensa"
              >
                <View style={styles.despensaIcono}>
                  <Ionicons name="basket-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.despensaTexto}>
                  <Text style={styles.despensaTitulo}>Solo lo que puedo cocinar</Text>
                  <Text style={styles.despensaSub}>Recetas con (casi) todos los ingredientes en tu despensa</Text>
                </View>
                <Switch
                  value={borrador.soloDespensa}
                  onValueChange={(v) => setBorrador((b) => ({ ...b, soloDespensa: v }))}
                  trackColor={{ true: colors.primary, false: colors.gray }}
                  thumbColor={colors.white}
                />
              </Pressable>
            )}

            <Seccion icono="restaurant-outline" titulo="Tipo de comida">
              {CATEGORIAS_RECETA.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  activo={borrador.categorias.includes(c)}
                  onPress={() => toggle('categorias', c)}
                  testID={`filtro-categoria-${c}`}
                />
              ))}
            </Seccion>

            <Divisor />

            <Seccion icono="time-outline" titulo="Tiempo de cocinado">
              {TIEMPOS_RECETA.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  activo={borrador.tiempos.includes(t.value)}
                  onPress={() => toggle('tiempos', t.value)}
                  testID={`filtro-tiempo-${t.value}`}
                />
              ))}
            </Seccion>

            <Divisor />

            <Seccion icono="speedometer-outline" titulo="Dificultad">
              {DIFICULTADES_RECETA.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  activo={borrador.dificultades.includes(d)}
                  onPress={() => toggle('dificultades', d)}
                  testID={`filtro-dificultad-${d}`}
                />
              ))}
            </Seccion>

            <Divisor />

            <Seccion icono="people-outline" titulo="Personas">
              {PERSONAS_RECETA.map((p) => (
                <Chip
                  key={p.value}
                  label={p.label}
                  activo={borrador.personas.includes(p.value)}
                  onPress={() => toggle('personas', p.value)}
                  testID={`filtro-personas-${p.value}`}
                />
              ))}
            </Seccion>

            <Divisor />

            <Seccion icono="pricetags-outline" titulo="Etiquetas">
              {ETIQUETAS_RECETA.map((e) => (
                <Chip
                  key={e}
                  label={e}
                  activo={borrador.etiquetas.includes(e)}
                  onPress={() => toggle('etiquetas', e)}
                  testID={`filtro-etiqueta-${e}`}
                />
              ))}
            </Seccion>
          </ScrollView>

          <View style={styles.acciones}>
            <Pressable
              style={[styles.btnLimpiar, total === 0 && styles.btnLimpiarInactivo]}
              onPress={() => setBorrador(FILTROS_RECETA_VACIOS)}
              disabled={total === 0}
              testID="filtros-limpiar"
            >
              <Text style={[styles.btnLimpiarTexto, total === 0 && styles.btnLimpiarTextoInactivo]}>
                Limpiar
              </Text>
            </Pressable>
            <Pressable style={styles.btnAplicar} onPress={() => onAplicar(borrador)} testID="filtros-aplicar">
              <Text style={styles.btnAplicarTexto}>{total > 0 ? `Aplicar (${total})` : 'Aplicar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Seccion({ icono, titulo, children }: { icono: keyof typeof Ionicons.glyphMap; titulo: string; children: ReactNode }) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionCabecera}>
        <Ionicons name={icono} size={16} color={colors.text.secondary} />
        <Text style={styles.seccionTitulo}>{titulo}</Text>
      </View>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Divisor() {
  return <View style={styles.divisor} />;
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
  return (
    <Pressable onPress={onPress} testID={testID} style={[styles.chip, activo && styles.chipActivo]}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray,
    marginBottom: spacing.md,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  titulo: { ...typography.heading2, color: colors.text.primary },
  contadorPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorPillTexto: { ...typography.caption, fontSize: 12, color: colors.white, fontWeight: '700' },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  despensaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F1F8E4',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  despensaIcono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  despensaTexto: { flex: 1, gap: 2 },
  despensaTitulo: { ...typography.label, color: colors.text.primary, fontWeight: '700' },
  despensaSub: { ...typography.caption, color: colors.text.secondary },

  seccion: { gap: spacing.sm, paddingVertical: spacing.md },
  seccionCabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  seccionTitulo: {
    ...typography.label,
    color: colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
  },
  chipActivo: { backgroundColor: colors.primary },
  chipTexto: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  chipTextoActivo: { color: colors.white },

  divisor: { height: 1, backgroundColor: colors.grayLight },

  acciones: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  btnLimpiar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray,
    alignItems: 'center',
  },
  btnLimpiarInactivo: { borderColor: colors.grayLight },
  btnLimpiarTexto: { ...typography.button, color: colors.text.secondary },
  btnLimpiarTextoInactivo: { color: colors.grayMid },
  btnAplicar: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnAplicarTexto: { ...typography.button, color: colors.white },
});
