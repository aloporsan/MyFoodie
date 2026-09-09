import { StyleSheet, Text, View } from 'react-native';
import { LoteProducto } from '@/services/loteService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { LoteCard } from './LoteCard';

interface Props {
  lotes: LoteProducto[];
  onEditar: (lote: LoteProducto) => void;
  onEliminar: (lote: LoteProducto) => void;
}

// El backend ya devuelve los lotes ordenados por fecha de caducidad ascendente
// (findByProductoIdOrderByFechaCaducidadAsc): el más urgente aparece primero.
export function ListaLotes({ lotes, onEditar, onEliminar }: Props) {
  if (lotes.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioText}>No hay lotes registrados todavía</Text>
      </View>
    );
  }

  return (
    <View>
      {lotes.map((lote) => (
        <LoteCard
          key={lote.id}
          lote={lote}
          onEditar={() => onEditar(lote)}
          onEliminar={() => onEliminar(lote)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  vacio: { paddingVertical: spacing.md, alignItems: 'center' },
  vacioText: { ...typography.caption, color: colors.text.secondary },
});
