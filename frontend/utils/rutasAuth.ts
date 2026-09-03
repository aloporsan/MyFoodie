import type { Href } from 'expo-router';

/**
 * Decide a qué pantalla enviar a un usuario recién autenticado:
 * - si aún no ha visto el tour de bienvenida (onboarding), se le muestra
 * - si acaba de registrarse, va al onboarding de preferencias
 * - en cualquier otro caso, a la app principal
 */
export function rutaPostAutenticacion(
  onboardingVisto: boolean,
  recienRegistrado: boolean,
): Href {
  if (!onboardingVisto) return '/onboarding';
  return recienRegistrado ? '/onboarding-preferencias' : '/(tabs)';
}
