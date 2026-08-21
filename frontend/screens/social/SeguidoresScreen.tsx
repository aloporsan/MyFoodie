import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { BuscadorUsuarios, UsuarioCard } from '@/components/social';
import { useSocialStore } from '@/store/socialStore';
import { colors, spacing, typography } from '@/theme';

export function SeguidoresScreen() {
  const router = useRouter();
  const { usuarioId: rawUsuarioId } = useLocalSearchParams<{ usuarioId?: string }>();
  const usuarioId = Array.isArray(rawUsuarioId) ? rawUsuarioId[0] : rawUsuarioId;

  const seguidores = useSocialStore((s) => s.seguidores);
  const isLoading = useSocialStore((s) => s.isLoading);
  const cargarSeguidores = useSocialStore((s) => s.cargarSeguidores);

  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(() => {
    cargarSeguidores(usuarioId);
  }, [usuarioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const texto = filtro.trim().toLowerCase();
    if (!texto) return seguidores;
    return seguidores.filter(
      (s) => s.nombre.toLowerCase().includes(texto) || s.nombreUsuario.toLowerCase().includes(texto)
    );
  }, [seguidores, filtro]);

  if (isLoading && seguidores.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.titulo}>Seguidores</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.buscadorWrapper}>
        <BuscadorUsuarios
          value={filtro}
          onBuscar={setFiltro}
          onLimpiar={() => setFiltro('')}
          placeholder="Filtrar por nombre..."
        />
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(s) => s.id}
        contentContainerStyle={filtrados.length === 0 ? styles.listaVacia : styles.lista}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={cargar} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <UsuarioCard
            usuario={{
              id: item.usuarioId,
              nombre: item.nombre,
              nombreUsuario: item.nombreUsuario,
              fotoPerfil: item.fotoPerfil,
              esSeguido: false,
              haSolicitado: false,
            }}
            onPress={() => router.push(`/social/perfil/${item.usuarioId}`)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.vacio}>
              <Ionicons name="people-outline" size={56} color={colors.grayMid} />
              <Text style={styles.vacioTexto}>
                {filtro ? 'No se encontraron seguidores con ese nombre' : 'Aún no tienes seguidores'}
              </Text>
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
  buscadorWrapper: { padding: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.white },

  lista: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  listaVacia: { flexGrow: 1 },

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
