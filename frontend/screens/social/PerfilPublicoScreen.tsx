import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { showConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import type { PerfilPublico } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';
import { borderRadius, colors, spacing, typography } from '@/theme';

type EstadoBotonPerfil = 'seguir' | 'solicitar' | 'siguiendo' | 'pendiente';

function calcularEstadoBoton(perfil: PerfilPublico): EstadoBotonPerfil {
  if (perfil.esSeguido) return 'siguiendo';
  if (perfil.haSolicitado) return 'pendiente';
  return perfil.privacidad === 'PRIVADA' ? 'solicitar' : 'seguir';
}

const LABEL_POR_ESTADO: Record<EstadoBotonPerfil, string> = {
  seguir: 'Seguir',
  solicitar: 'Solicitar seguimiento',
  siguiendo: 'Siguiendo',
  pendiente: 'Pendiente',
};

export function PerfilPublicoScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const perfilPublico = useSocialStore((s) => s.perfilPublico);
  const isLoading = useSocialStore((s) => s.isLoading);
  const error = useSocialStore((s) => s.error);
  const cargarPerfilPublico = useSocialStore((s) => s.cargarPerfilPublico);
  const seguirUsuario = useSocialStore((s) => s.seguirUsuario);
  const dejarDeSeguir = useSocialStore((s) => s.dejarDeSeguir);
  const bloquearUsuario = useSocialStore((s) => s.bloquearUsuario);
  const desbloquearUsuario = useSocialStore((s) => s.desbloquearUsuario);

  useEffect(() => {
    if (id) cargarPerfilPublico(id);
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));

  const handleSeguir = async () => {
    if (!id || !perfilPublico) return;
    try {
      if (perfilPublico.esSeguido || perfilPublico.haSolicitado) {
        await dejarDeSeguir(id);
      } else {
        await seguirUsuario(id);
      }
    } catch {
      showError('No se pudo actualizar el seguimiento');
    }
  };

  const handleBloquear = () => {
    if (!id || !perfilPublico) return;
    showConfirm(
      'Bloquear usuario',
      `¿Seguro que quieres bloquear a @${perfilPublico.nombreUsuario}? Ya no podrá ver tu perfil ni interactuar contigo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await bloquearUsuario(id);
              showSuccess('Usuario bloqueado');
            } catch {
              showError('No se pudo bloquear al usuario');
            }
          },
        },
      ],
      { icon: 'ban-outline' }
    );
  };

  const handleDesbloquear = async () => {
    if (!id) return;
    try {
      await desbloquearUsuario(id);
      showSuccess('Usuario desbloqueado');
    } catch {
      showError('No se pudo desbloquear al usuario');
    }
  };

  const handleReportar = () => {
    showSuccess('Los reportes de perfil estarán disponibles próximamente');
  };

  const handleOpciones = () => {
    if (!perfilPublico) return;
    showConfirm(
      'Opciones',
      undefined,
      perfilPublico.estaBloqueado
        ? [
            { text: 'Desbloquear usuario', onPress: handleDesbloquear },
            { text: 'Cancelar', style: 'cancel' },
          ]
        : [
            { text: 'Reportar perfil', onPress: handleReportar },
            { text: 'Bloquear usuario', style: 'destructive', onPress: handleBloquear },
            { text: 'Cancelar', style: 'cancel' },
          ]
    );
  };

  if (isLoading && !perfilPublico) {
    return <LoadingScreen />;
  }

  if (!isLoading && (error || !perfilPublico)) {
    return (
      <ErrorScreen
        titulo="No se pudo cargar el perfil"
        descripcion={error ?? 'Usuario no encontrado'}
        onVolver={goBack}
        onReintentar={id ? () => cargarPerfilPublico(id) : undefined}
      />
    );
  }

  if (!perfilPublico) return null;

  const iniciales = perfilPublico.nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const esPrivado = perfilPublico.privacidad === 'PRIVADA';
  const puedeVerRecetas = !perfilPublico.estaBloqueado && (!esPrivado || perfilPublico.esSeguido);
  const estadoBoton = calcularEstadoBoton(perfilPublico);
  const botonOutline = estadoBoton === 'siguiendo' || estadoBoton === 'solicitar';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>
          @{perfilPublico.nombreUsuario}
        </Text>
        <Pressable onPress={handleOpciones} hitSlop={8} testID="btn-opciones">
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.fotoWrapper}>
          {perfilPublico.fotoPerfil ? (
            <Image source={{ uri: perfilPublico.fotoPerfil }} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.iniciales}>{iniciales}</Text>
            </View>
          )}
        </View>

        <Text style={styles.nombre}>{perfilPublico.nombre}</Text>
        <Text style={styles.nombreUsuario}>@{perfilPublico.nombreUsuario}</Text>
        {perfilPublico.biografia ? <Text style={styles.biografia}>{perfilPublico.biografia}</Text> : null}

        <View style={styles.statsRow}>
          <Pressable
            style={styles.statItem}
            onPress={() =>
              router.push({ pathname: '/social/seguidores', params: { usuarioId: perfilPublico.id } })
            }
          >
            <Text style={styles.statValor}>{perfilPublico.numSeguidores}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </Pressable>
          <Pressable
            style={styles.statItem}
            onPress={() =>
              router.push({ pathname: '/social/seguidos', params: { usuarioId: perfilPublico.id } })
            }
          >
            <Text style={styles.statValor}>{perfilPublico.numSeguidos}</Text>
            <Text style={styles.statLabel}>Seguidos</Text>
          </Pressable>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{perfilPublico.numRecetas}</Text>
            <Text style={styles.statLabel}>Recetas</Text>
          </View>
        </View>

        {!perfilPublico.estaBloqueado && (
          <Pressable
            style={[styles.botonAccion, botonOutline ? styles.botonAccionOutline : styles.botonAccionSolido]}
            onPress={handleSeguir}
            testID="btn-seguir"
          >
            <Text
              style={[
                styles.botonAccionTexto,
                botonOutline ? styles.botonAccionTextoOutline : styles.botonAccionTextoSolido,
              ]}
            >
              {LABEL_POR_ESTADO[estadoBoton]}
            </Text>
          </Pressable>
        )}

        <View style={styles.recetasSeccion}>
          <Text style={styles.seccionTitulo}>Recetas</Text>
          {perfilPublico.estaBloqueado ? (
            <View style={styles.infoBox}>
              <Ionicons name="ban-outline" size={40} color={colors.grayMid} />
              <Text style={styles.infoBoxTexto}>Has bloqueado a este usuario</Text>
            </View>
          ) : !puedeVerRecetas ? (
            <View style={styles.infoBox}>
              <Ionicons name="lock-closed-outline" size={40} color={colors.grayMid} />
              <Text style={styles.infoBoxTexto}>Este perfil es privado</Text>
            </View>
          ) : (
            <View style={styles.infoBox}>
              <Ionicons name="book-outline" size={40} color={colors.grayMid} />
              <Text style={styles.infoBoxTexto}>
                El listado de recetas publicadas estará disponible próximamente
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    gap: spacing.sm,
  },
  headerTitulo: { ...typography.heading3, color: colors.text.primary, flex: 1, textAlign: 'center' },

  scroll: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },

  fotoWrapper: { marginTop: spacing.xl, marginBottom: spacing.md },
  foto: { width: 96, height: 96, borderRadius: borderRadius.full },
  fotoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: { ...typography.heading1, color: colors.white },

  nombre: { ...typography.heading2, color: colors.text.primary, marginBottom: spacing.xs },
  nombreUsuario: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.sm },
  biografia: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValor: { ...typography.heading3, color: colors.text.primary },
  statLabel: { ...typography.caption, color: colors.text.secondary },

  botonAccion: {
    width: '100%',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: spacing.xl,
  },
  botonAccionSolido: { backgroundColor: colors.primary },
  botonAccionOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  botonAccionTexto: { ...typography.button },
  botonAccionTextoSolido: { color: colors.white },
  botonAccionTextoOutline: { color: colors.primary },

  recetasSeccion: { width: '100%', gap: spacing.md },
  seccionTitulo: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
  },
  infoBoxTexto: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
