import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BuscadorUsuarios, UsuarioCard } from '@/components/social';
import { useToast } from '@/hooks/useToast';
import type { UsuarioBusqueda } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';
import { colors, spacing, typography } from '@/theme';

export function BuscarUsuariosScreen() {
  const router = useRouter();
  const { showError } = useToast();

  const resultadosBusqueda = useSocialStore((s) => s.resultadosBusqueda);
  const isLoading = useSocialStore((s) => s.isLoading);
  const buscarUsuarios = useSocialStore((s) => s.buscarUsuarios);
  const seguirUsuario = useSocialStore((s) => s.seguirUsuario);
  const dejarDeSeguir = useSocialStore((s) => s.dejarDeSeguir);

  const [texto, setTexto] = useState('');

  const handleBuscar = (t: string) => {
    setTexto(t);
    buscarUsuarios(t);
  };

  const handleLimpiar = () => {
    setTexto('');
    buscarUsuarios('');
  };

  const handleSeguir = async (usuario: UsuarioBusqueda) => {
    try {
      if (usuario.esSeguido || usuario.haSolicitado) {
        await dejarDeSeguir(usuario.id);
      } else {
        await seguirUsuario(usuario.id);
      }
    } catch {
      showError('No se pudo actualizar el seguimiento');
    }
  };

  const busquedaActiva = texto.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.buscadorWrapper}>
          <BuscadorUsuarios value={texto} onBuscar={handleBuscar} onLimpiar={handleLimpiar} />
        </View>
      </View>

      {!busquedaActiva ? (
        <View style={styles.vacio}>
          <Ionicons name="search-outline" size={56} color={colors.grayMid} />
          <Text style={styles.vacioTexto}>Busca usuarios por nombre o @usuario</Text>
        </View>
      ) : (
        <FlatList
          data={resultadosBusqueda}
          keyExtractor={(u) => u.id}
          contentContainerStyle={resultadosBusqueda.length === 0 ? styles.listaVacia : styles.lista}
          renderItem={({ item }) => (
            <UsuarioCard
              usuario={item}
              onPress={() => router.push(`/social/perfil/${item.id}`)}
              onSeguir={() => handleSeguir(item)}
            />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.vacio}>
                <Ionicons name="person-remove-outline" size={56} color={colors.grayMid} />
                <Text style={styles.vacioTexto}>No se encontraron usuarios</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  buscadorWrapper: { flex: 1 },

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
