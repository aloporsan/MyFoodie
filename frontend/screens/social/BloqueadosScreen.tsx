import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { UsuarioCard } from '@/components/social';
import { showConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import type { UsuarioBusqueda } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';
import { borderRadius, colors, spacing, typography } from '@/theme';

export function BloqueadosScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const bloqueados = useSocialStore((s) => s.bloqueados);
  const isLoading = useSocialStore((s) => s.isLoading);
  const cargarBloqueados = useSocialStore((s) => s.cargarBloqueados);
  const desbloquearUsuario = useSocialStore((s) => s.desbloquearUsuario);

  useEffect(() => {
    cargarBloqueados();
  }, []);

  const handleDesbloquear = (usuario: UsuarioBusqueda) => {
    showConfirm(
      'Desbloquear usuario',
      `¿Quieres desbloquear a @${usuario.nombreUsuario}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              await desbloquearUsuario(usuario.id);
              showSuccess('Usuario desbloqueado');
            } catch {
              showError('No se pudo desbloquear al usuario');
            }
          },
        },
      ]
    );
  };

  if (isLoading && bloqueados.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Usuarios bloqueados</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bloqueados}
        keyExtractor={(u) => u.id}
        contentContainerStyle={bloqueados.length === 0 ? styles.listaVacia : styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargarBloqueados} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <View style={styles.filaCard}>
              <UsuarioCard usuario={{ ...item, esSeguido: false, haSolicitado: false }} />
            </View>
            <Pressable
              style={styles.btnDesbloquear}
              onPress={() => handleDesbloquear(item)}
              testID="btn-desbloquear"
            >
              <Text style={styles.btnDesbloquearTexto}>Desbloquear</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="ban-outline" size={56} color={colors.grayMid} />
              <Text style={styles.vacioTexto}>No has bloqueado a ningún usuario</Text>
            </View>
          ) : null
        }
      />
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

  lista: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  listaVacia: { flexGrow: 1 },

  fila: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  filaCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  btnDesbloquear: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  btnDesbloquearTexto: {
    ...typography.label,
    color: colors.error,
  },

  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  vacioTexto: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
