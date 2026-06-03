import { Ionicons } from '@expo/vector-icons';
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
      {perfil.fotoPerfil ? (
        <Image source={{ uri: perfil.fotoPerfil }} style={styles.foto} />
      ) : (
        <View style={styles.fotoPlaceholder}>
          <Text style={styles.iniciales}>{iniciales}</Text>
        </View>
      )}

      <Text style={styles.nombre}>{perfil.nombre}</Text>
      <Text style={styles.nombreUsuario}>@{perfil.nombreUsuario}</Text>

      {perfil.biografia ? (
        <Text style={styles.biografia}>{perfil.biografia}</Text>
      ) : null}

      <Text style={styles.fechaRegistro}>{formatFechaRegistro(perfil.fechaRegistro)}</Text>

      <Pressable
        style={styles.editarBtn}
        onPress={() => router.push('/perfil/editar')}
        hitSlop={8}
      >
        <Ionicons name="pencil-outline" size={15} color={colors.primary} />
        <Text style={styles.editarTexto}>Editar perfil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  foto: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  fotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  fechaRegistro: {
    ...typography.caption,
    color: colors.grayMid,
    marginBottom: spacing.lg,
  },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editarTexto: {
    ...typography.label,
    color: colors.primary,
  },
});
