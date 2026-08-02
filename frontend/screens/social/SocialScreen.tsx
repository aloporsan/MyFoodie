import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompartirStore } from '@/store/compartirStore';
import { useSocialStore } from '@/store/socialStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

interface MenuItem {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  badge?: number;
}

export function SocialScreen() {
  const router = useRouter();

  const solicitudesPendientes = useSocialStore((s) => s.solicitudesPendientes);
  const cargarSolicitudes = useSocialStore((s) => s.cargarSolicitudes);
  const contadorNoLeidas = useCompartirStore((s) => s.contadorNoLeidas);
  const cargarContador = useCompartirStore((s) => s.cargarContador);

  useEffect(() => {
    cargarSolicitudes();
    cargarContador();
  }, []);

  const items: MenuItem[] = [
    {
      icono: 'person-add-outline',
      label: 'Solicitudes de seguimiento',
      onPress: () => router.push('/social/solicitudes'),
      badge: solicitudesPendientes.length,
    },
    {
      icono: 'gift-outline',
      label: 'Recetas recibidas',
      onPress: () => router.push('/compartir/recibidas'),
      badge: contadorNoLeidas,
    },
    {
      icono: 'search-outline',
      label: 'Buscar usuarios',
      onPress: () => router.push('/social/buscar'),
    },
    {
      icono: 'ban-outline',
      label: 'Usuarios bloqueados',
      onPress: () => router.push('/social/bloqueados'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Social</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.contenido}>
        <View style={styles.card}>
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              style={[styles.item, index < items.length - 1 && styles.itemBorde]}
              onPress={item.onPress}
              hitSlop={4}
            >
              <View style={styles.itemIzquierda}>
                <View style={styles.iconoWrapper}>
                  <Ionicons name={item.icono} size={18} color={colors.grayDark} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {!!item.badge && (
                  <View style={styles.badge} testID={`badge-${item.label}`}>
                    <Text style={styles.badgeTexto}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.grayMid} />
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  titulo: { ...typography.heading2, color: colors.text.primary },

  contenido: { padding: spacing.lg },

  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  itemBorde: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  itemIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconoWrapper: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeTexto: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
});
