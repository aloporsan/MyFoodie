import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PrivacidadToggle } from '@/components/perfil/PrivacidadToggle';
import { usePerfilStore } from '@/store/perfilStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

export function PrivacidadScreen() {
  const router = useRouter();
  const { actualizarPrivacidad } = usePerfilStore();

  const [perfilPublico, setPerfilPublico] = useState(true);
  const [mostrarRecetas, setMostrarRecetas] = useState(true);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(true);
  const [permitirMensajes, setPermitirMensajes] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  const handleCambio = async (
    campo: string,
    setter: (v: boolean) => void,
    valor: boolean,
  ) => {
    setter(valor);
    setGuardando(campo);
    try {
      await actualizarPrivacidad({ [campo]: valor });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Privacidad</Text>
        <View style={styles.headerRight}>
          {guardando && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.infoTexto}>
          Los cambios se guardan automáticamente al activar o desactivar cada opción.
        </Text>

        <View style={styles.card}>
          <PrivacidadToggle
            label="Perfil público"
            descripcion="Cualquier usuario puede ver tu perfil"
            valor={perfilPublico}
            onChange={(v) => handleCambio('perfilPublico', setPerfilPublico, v)}
          />
          <Separador />
          <PrivacidadToggle
            label="Mostrar recetas"
            descripcion="Tus recetas publicadas son visibles para otros"
            valor={mostrarRecetas}
            onChange={(v) => handleCambio('mostrarRecetas', setMostrarRecetas, v)}
          />
          <Separador />
          <PrivacidadToggle
            label="Mostrar estadísticas"
            descripcion="Otros usuarios pueden ver tus estadísticas"
            valor={mostrarEstadisticas}
            onChange={(v) => handleCambio('mostrarEstadisticas', setMostrarEstadisticas, v)}
          />
          <Separador />
          <PrivacidadToggle
            label="Permitir mensajes"
            descripcion="Otros usuarios pueden enviarte mensajes"
            valor={permitirMensajes}
            onChange={(v) => handleCambio('permitirMensajes', setPermitirMensajes, v)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Separador() {
  return <View style={{ height: 1, backgroundColor: colors.grayLight, marginVertical: 2 }} />;
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
    borderBottomColor: colors.grayLight,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { ...typography.heading3, color: colors.text.primary },
  headerRight: { width: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  infoTexto: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
});
