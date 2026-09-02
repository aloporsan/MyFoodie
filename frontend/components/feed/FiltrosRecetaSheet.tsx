import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
}

export function FiltrosRecetaSheet({ visible, filtros, onAplicar, onCerrar }: Props) {
  const [borrador, setBorrador] = useState<FiltrosReceta>(filtros);

  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  const toggle = (clave: keyof FiltrosReceta, valor: string) => {
    setBorrador((b) => ({ ...b, [clave]: alternarValor(b[clave], valor) }));
  };

  const total = contarFiltros(borrador);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onCerrar}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCerrar} testID="filtros-overlay" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.titulo}>Filtrar recetas</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Seccion titulo="Tipo de comida">
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

            <Seccion titulo="Tiempo de cocinado">
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

            <Seccion titulo="Dificultad">
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

            <Seccion titulo="Personas">
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

            <Seccion titulo="Etiquetas">
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
              style={styles.btnLimpiar}
              onPress={() => setBorrador(FILTROS_RECETA_VACIOS)}
              testID="filtros-limpiar"
            >
              <Text style={styles.btnLimpiarTexto}>Limpiar todo</Text>
            </Pressable>
            <Pressable
              style={styles.btnAplicar}
              onPress={() => onAplicar(borrador)}
              testID="filtros-aplicar"
            >
              <Text style={styles.btnAplicarTexto}>
                {total > 0 ? `Aplicar (${total})` : 'Aplicar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
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
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[styles.chip, activo && styles.chipActivo]}
    >
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray,
    marginBottom: spacing.sm,
  },
  titulo: { ...typography.heading2, color: colors.text.primary, marginBottom: spacing.md },
  scroll: { paddingBottom: spacing.md, gap: spacing.lg },
  seccion: { gap: spacing.sm },
  seccionTitulo: { ...typography.label, color: colors.text.secondary, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { ...typography.caption, color: colors.text.secondary, fontWeight: '600' },
  chipTextoActivo: { color: colors.white },
  acciones: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  btnLimpiarTexto: { ...typography.button, color: colors.text.secondary },
  btnAplicar: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnAplicarTexto: { ...typography.button, color: colors.white },
});
