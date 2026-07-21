import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { showConfirm } from '@/hooks/useConfirm';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { usePerfilStore } from '@/store/perfilStore';

interface MenuItem {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructivo?: boolean;
}

export function MenuPerfil() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { cerrarSesion, eliminarCuenta, reset } = usePerfilStore();

  const handleCerrarSesion = () => {
    showConfirm(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await cerrarSesion();
            reset();
            await logout();
          },
        },
      ],
      { icon: 'log-out-outline' }
    );
  };

  const handleEliminarCuenta = () => {
    showConfirm(
      'Eliminar cuenta',
      'Esta acción es irreversible. Se eliminarán todos tus datos personales y no podrás recuperar tu cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            showConfirm(
              '¿Estás completamente seguro?',
              'Tus recetas publicadas quedarán disociadas de tu perfil. Esta operación no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar definitivamente',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await eliminarCuenta();
                      reset();
                      await logout();
                    } catch {
                      showConfirm('Error', 'No se pudo eliminar la cuenta. Inténtalo de nuevo.', undefined, {
                        icon: 'alert-circle-outline',
                      });
                    }
                  },
                },
              ],
              { icon: 'warning-outline' }
            );
          },
        },
      ],
      { icon: 'trash-outline' }
    );
  };

  const items: MenuItem[] = [
    {
      icono: 'book-outline',
      label: 'Mis recetas publicadas',
      onPress: () => router.push('/perfil/recetas-publicadas'),
    },
    {
      icono: 'bookmark-outline',
      label: 'Recetas guardadas',
      onPress: () => router.push('/perfil/recetas-guardadas'),
    },
    {
      icono: 'nutrition-outline',
      label: 'Preferencias alimentarias',
      onPress: () => router.push('/perfil/preferencias'),
    },
    {
      icono: 'lock-closed-outline',
      label: 'Privacidad',
      onPress: () => router.push('/perfil/privacidad'),
    },
    {
      icono: 'bar-chart-outline',
      label: 'Estadísticas',
      onPress: () => router.push('/perfil/estadisticas'),
    },
    {
      icono: 'log-out-outline',
      label: 'Cerrar sesión',
      onPress: handleCerrarSesion,
      destructivo: true,
    },
    {
      icono: 'trash-outline',
      label: 'Eliminar cuenta',
      onPress: handleEliminarCuenta,
      destructivo: true,
    },
  ];

  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          style={[styles.item, index < items.length - 1 && styles.itemBorde]}
          onPress={item.onPress}
          hitSlop={4}
        >
          <View style={styles.itemIzquierda}>
            <View style={[styles.iconoWrapper, item.destructivo && styles.iconoWrapperDestructivo]}>
              <Ionicons
                name={item.icono}
                size={18}
                color={item.destructivo ? colors.error : colors.grayDark}
              />
            </View>
            <Text style={[styles.itemLabel, item.destructivo && styles.itemLabelDestructivo]}>
              {item.label}
            </Text>
          </View>
          {!item.destructivo && (
            <Ionicons name="chevron-forward" size={18} color={colors.grayMid} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
  iconoWrapperDestructivo: {
    backgroundColor: '#FFEBEB',
  },
  itemLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  itemLabelDestructivo: {
    color: colors.error,
  },
});
