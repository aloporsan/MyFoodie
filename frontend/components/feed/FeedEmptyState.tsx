import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFeedStore } from '@/store/feedStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function FeedEmptyState() {
  const router = useRouter();
  const limpiarDescartadas = useFeedStore((s) => s.limpiarDescartadas);

  const handleVerDeNuevo = () => {
    limpiarDescartadas().catch(() => {
      // el error ya queda reflejado en el store y se muestra como toast en FeedScreen
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="restaurant-outline" size={72} color={colors.primary} />
      </View>

      <Text style={styles.titulo}>¡Has visto todas las recetas disponibles!</Text>
      <Text style={styles.subtitulo}>
        Vuelve más tarde para descubrir nuevas recetas de la comunidad.
      </Text>

      <Pressable style={styles.btnPrimario} onPress={handleVerDeNuevo} hitSlop={4}>
        <Ionicons name="refresh" size={20} color={colors.white} />
        <Text style={styles.btnPrimarioTexto}>Ver recetas de nuevo</Text>
      </Pressable>

      <Pressable
        style={styles.btnSecundario}
        onPress={() => router.push('/(tabs)/receta')}
        hitSlop={4}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.btnSecundarioTexto}>Crear una receta</Text>
      </Pressable>

      <Pressable style={styles.btnDeshabilitado} disabled hitSlop={4}>
        <Ionicons name="search-outline" size={20} color={colors.grayMid} />
        <Text style={styles.btnDeshabilitadoTexto}>Buscar recetas</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>Pronto</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitulo: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
    minHeight: 44,
    minWidth: 200,
  },
  btnPrimarioTexto: {
    ...typography.button,
    color: colors.white,
  },
  btnSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    minHeight: 44,
    minWidth: 200,
  },
  btnSecundarioTexto: {
    ...typography.button,
    color: colors.primary,
  },
  btnDeshabilitado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    minHeight: 44,
    minWidth: 200,
  },
  btnDeshabilitadoTexto: {
    ...typography.button,
    color: colors.grayMid,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.xs,
  },
  badgeTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
});
