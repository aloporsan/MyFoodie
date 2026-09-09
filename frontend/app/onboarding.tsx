import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';
import { useAuthStore } from '@/store/authStore';

export default function Onboarding() {
  const router = useRouter();
  const completarOnboarding = useAuthStore((s) => s.completarOnboarding);
  const recienRegistrado = useAuthStore((s) => s.recienRegistrado);

  const handleFinish = async () => {
    await completarOnboarding();
    router.replace(recienRegistrado ? '/onboarding-preferencias' : '/(tabs)');
  };

  return <OnboardingScreen onFinish={handleFinish} />;
}
