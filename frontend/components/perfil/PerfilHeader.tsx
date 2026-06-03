import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '@/theme';
import type { Perfil } from '@/services/perfilService';

interface Props {
  perfil: Perfil;
}

function formatFechaRegistro(fecha: string): string {
  const date = new Date(fecha);
  return `Miembro desde ${date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
}

export function PerfilHeader({ perfil }: Props) {
  const router = useRouter();

  const iniciales = perfil.nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      />

      <View style={styles.contenido}>
        <View style={styles.fotoWrapper}>
          {perfil.fotoPerfil ? (
            <Image source={{ uri: perfil.fotoPerfil }} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.iniciales}>{iniciales}</Text>
            </View>
          )}
        </View>

        <Text style={styles.nombre}>{perfil.nombre}</Text>
        <Text style={styles.nombreUsuario}>@{perfil.nombreUsuario}</Text>

        {perfil.biografia ? (
          <Text style={styles.biografia}>{perfil.biografia}</Text>
        ) : null}

        <View style={styles.footerRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.grayMid} />
          <Text style={styles.fechaRegistro}>{formatFechaRegistro(perfil.fechaRegistro)}</Text>
        </View>

        <Pressable
          style={styles.editarBtn}
          onPress={() => router.push('/perfil/editar')}
          hitSlop={8}
        >
          <Ionicons name="pencil-outline" size={15} color={colors.white} />
          <Text style={styles.editarTexto}>Editar perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  banner: {
    height: 80,
    width: '100%',
  },
  contenido: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: -44,
  },
  fotoWrapper: {
    borderWidth: 4,
    borderColor: colors.white,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
  },
  foto: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
  },
  fotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: {
    ...typography.heading1,
    color: colors.white,
  },
  nombre: {
    ...typography.heading2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  nombreUsuario: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  biografia: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  fechaRegistro: {
    ...typography.caption,
    color: colors.grayMid,
  },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editarTexto: {
    ...typography.label,
    color: colors.white,
  },
});
