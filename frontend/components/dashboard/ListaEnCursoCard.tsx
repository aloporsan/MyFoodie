import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ListaCompra } from '@/services/carritoService';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface Props {
  lista: ListaCompra;
  onPress: () => void;
}

export function ListaEnCursoCard({ lista, onPress }: Props) {
  const comprados = lista.items.filter((i) => i.estado === 'comprado').length;
  const total = lista.items.length;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Ionicons name="cart" size={24} color={colors.white} />
        </View>
        <View style={styles.texto}>
          <Text style={styles.titulo}>Compra en curso</Text>
          <Text style={styles.descripcion} numberOfLines={1}>
            {lista.nombre} · {comprados}/{total} comprados
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    ...typography.label,
    color: colors.white,
  },
  descripcion: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
});
