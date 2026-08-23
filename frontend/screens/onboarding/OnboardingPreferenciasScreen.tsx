import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreferenciaChip } from '@/components/perfil/PreferenciaChip';
import { feedService } from '@/services/feedService';
import { useAuthStore } from '@/store/authStore';
import { borderRadius, colors, spacing, typography } from '@/theme';

const TIPOS_COCINA = [
  'Mediterránea',
  'Italiana',
  'Asiática',
  'Mexicana',
  'Americana',
  'India',
  'China',
  'Japonesa',
  'Francesa',
  'Árabe',
  'Vegetariana',
  'Vegana',
  'Saludable',
  'Económica',
  'Rápida y fácil',
];

const OPCIONES_TIEMPO: { label: string; valor: string }[] = [
  { label: 'Menos de 30 min', valor: 'menos_30' },
  { label: '30-60 min', valor: '30_60' },
  { label: 'Más de 1 hora', valor: 'mas_1_hora' },
  { label: 'Varía según el día', valor: 'varia' },
];

const TIPOS_DIETA = ['Ninguna', 'Vegetariana', 'Vegana', 'Sin gluten', 'Sin lactosa', 'Keto', 'Mediterránea'];

export function OnboardingPreferenciasScreen() {
  const router = useRouter();
  const marcarOnboardingVisto = useAuthStore((s) => s.marcarOnboardingVisto);

  const [tiposCocina, setTiposCocina] = useState<string[]>([]);
  const [tiempoDisponible, setTiempoDisponible] = useState<string | null>(null);
  const [tipoDieta, setTipoDieta] = useState('Ninguna');
  const [isLoading, setIsLoading] = useState(false);

  const toggleTipoCocina = (tipo: string) => {
    setTiposCocina((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
  };

  const irAlDashboard = () => {
    marcarOnboardingVisto();
    router.replace('/(tabs)');
  };

  const handleEmpezar = async () => {
    setIsLoading(true);
    try {
      const tipos = tipoDieta !== 'Ninguna' ? [...tiposCocina, tipoDieta] : tiposCocina;
      await feedService.inicializarPerfil(tipos, tiempoDisponible);
    } catch {
      // si falla la inicialización no bloqueamos el acceso a la app
    } finally {
      setIsLoading(false);
      irAlDashboard();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Cuéntanos tus gustos</Text>
        <Text style={styles.subtitulo}>
          Así podemos recomendarte recetas desde el primer momento
        </Text>

        <Seccion pregunta="¿Qué tipo de cocina te gusta?">
          <View style={styles.chips}>
            {TIPOS_COCINA.map((tipo) => (
              <PreferenciaChip
                key={tipo}
                label={tipo}
                activo={tiposCocina.includes(tipo)}
                onPress={() => toggleTipoCocina(tipo)}
              />
            ))}
          </View>
        </Seccion>

        <Seccion pregunta="¿Cuánto tiempo tienes para cocinar?">
          <View style={styles.chips}>
            {OPCIONES_TIEMPO.map((op) => (
              <PreferenciaChip
                key={op.valor}
                label={op.label}
                activo={tiempoDisponible === op.valor}
                onPress={() => setTiempoDisponible(op.valor)}
              />
            ))}
          </View>
        </Seccion>

        <Seccion pregunta="¿Sigues alguna dieta especial?">
          <View style={styles.chips}>
            {TIPOS_DIETA.map((dieta) => (
              <PreferenciaChip
                key={dieta}
                label={dieta}
                activo={tipoDieta === dieta}
                onPress={() => setTipoDieta(dieta)}
              />
            ))}
          </View>
        </Seccion>

        <Pressable style={styles.btnEmpezar} onPress={handleEmpezar} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnEmpezarTexto}>Empezar</Text>
          )}
        </Pressable>

        <Pressable style={styles.btnOmitir} onPress={irAlDashboard} disabled={isLoading}>
          <Text style={styles.btnOmitirTexto}>Omitir por ahora</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Seccion({ pregunta, children }: { pregunta: string; children: React.ReactNode }) {
  return (
    <View style={seccionStyles.wrapper}>
      <Text style={seccionStyles.pregunta}>{pregunta}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl },
  titulo: { ...typography.heading1, color: colors.text.primary },
  subtitulo: { ...typography.body, color: colors.text.secondary, marginTop: -spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  btnEmpezar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnEmpezarTexto: { ...typography.button, color: colors.white },
  btnOmitir: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnOmitirTexto: { ...typography.body, color: colors.text.secondary },
});

const seccionStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  pregunta: { ...typography.heading3, color: colors.text.primary },
});
