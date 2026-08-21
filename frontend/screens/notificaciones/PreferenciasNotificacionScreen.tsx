import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { PrivacidadToggle } from '@/components/perfil/PrivacidadToggle';
import type { PreferenciasNotificacion } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

type CampoPreferencia = keyof PreferenciasNotificacion;

const OPCIONES: { campo: CampoPreferencia; label: string; descripcion: string }[] = [
  {
    campo: 'notificarNuevoSeguidor',
    label: 'Nuevos seguidores',
    descripcion: 'Te avisamos cuando alguien empiece a seguirte',
  },
  {
    campo: 'notificarSolicitudSeguimiento',
    label: 'Solicitudes de seguimiento',
    descripcion: 'Te avisamos de solicitudes nuevas y cuando aceptan la tuya',
  },
  {
    campo: 'notificarLikes',
    label: 'Likes en mis recetas',
    descripcion: 'Te avisamos cuando alguien dé like a una receta tuya',
  },
  {
    campo: 'notificarComentarios',
    label: 'Comentarios en mis recetas',
    descripcion: 'Te avisamos cuando alguien comente una receta tuya',
  },
  {
    campo: 'notificarRecetasCompartidas',
    label: 'Recetas compartidas conmigo',
    descripcion: 'Te avisamos cuando alguien te comparta una receta',
  },
  {
    campo: 'notificarCaducidades',
    label: 'Alertas de caducidad',
    descripcion: 'Te avisamos cuando un producto esté a punto de caducar o se quede sin stock',
  },
  {
    campo: 'notificarCarrito',
    label: 'Actualizaciones del carrito',
    descripcion: 'Te avisamos cuando el carrito inteligente tenga nuevas recomendaciones',
  },
];

export function PreferenciasNotificacionScreen() {
  const router = useRouter();
  const preferencias = useNotificacionStore((s) => s.preferenciasNotificacion);
  const cargarPreferenciasNotificacion = useNotificacionStore(
    (s) => s.cargarPreferenciasNotificacion
  );
  const actualizarPreferenciasNotificacion = useNotificacionStore(
    (s) => s.actualizarPreferenciasNotificacion
  );

  const [valores, setValores] = useState<PreferenciasNotificacion | null>(null);
  const [guardando, setGuardando] = useState<CampoPreferencia | null>(null);

  useEffect(() => {
    cargarPreferenciasNotificacion();
  }, []);

  useEffect(() => {
    if (preferencias) setValores(preferencias);
  }, [preferencias]);

  const handleCambio = async (campo: CampoPreferencia, valor: boolean) => {
    setValores((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setGuardando(campo);
    try {
      await actualizarPreferenciasNotificacion({ [campo]: valor });
    } catch {
      setValores(preferencias);
    } finally {
      setGuardando(null);
    }
  };

  if (!valores) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Preferencias de notificación</Text>
        <View style={styles.headerRight}>
          {guardando && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.infoTexto}>
          Los cambios se guardan automáticamente al activar o desactivar cada opción.
        </Text>

        <View style={styles.card}>
          {OPCIONES.map((opcion, index) => (
            <View key={opcion.campo}>
              <PrivacidadToggle
                label={opcion.label}
                descripcion={opcion.descripcion}
                valor={valores[opcion.campo]}
                onChange={(v) => handleCambio(opcion.campo, v)}
              />
              {index < OPCIONES.length - 1 && <Separador />}
            </View>
          ))}
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
