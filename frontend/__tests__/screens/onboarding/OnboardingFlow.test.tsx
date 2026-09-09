import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '@/app/onboarding';
import { useAuthStore } from '@/store/authStore';
import { rutaPostAutenticacion } from '@/utils/rutasAuth';
import { useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
  setTokenGetter: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
}));

const mockReplace = jest.fn();

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  useAuthStore.setState({
    recienRegistrado: false,
    onboardingVisto: false,
    onboardingHidratado: false,
  });
});

const avanzarHastaElFinal = (getByTestId: any) => {
  for (let i = 0; i < 4; i++) fireEvent.press(getByTestId('onboarding-siguiente'));
};

it('muestra_onboarding_tras_primer_login', async () => {
  // Primer login: no hay nada guardado en AsyncStorage
  await useAuthStore.getState().cargarOnboardingVisto();

  expect(useAuthStore.getState().onboardingVisto).toBe(false);
  expect(rutaPostAutenticacion(false, false)).toBe('/onboarding');
});

it('no_muestra_onboarding_si_ya_fue_visto', async () => {
  await AsyncStorage.setItem('onboardingVisto', 'true');

  await useAuthStore.getState().cargarOnboardingVisto();

  expect(useAuthStore.getState().onboardingVisto).toBe(true);
  expect(rutaPostAutenticacion(true, false)).toBe('/(tabs)');
});

it('marca_visto_en_asyncstorage_al_omitir', async () => {
  const { getByTestId } = render(<Onboarding />);

  fireEvent.press(getByTestId('onboarding-omitir'));

  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('onboardingVisto', 'true'));
  expect(useAuthStore.getState().onboardingVisto).toBe(true);
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});

it('marca_visto_en_asyncstorage_al_completar', async () => {
  const { getByTestId } = render(<Onboarding />);

  avanzarHastaElFinal(getByTestId);
  fireEvent.press(getByTestId('onboarding-siguiente')); // "Empezar"

  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('onboardingVisto', 'true'));
  expect(useAuthStore.getState().onboardingVisto).toBe(true);
});

it('tras_completar_un_usuario_recien_registrado_va_al_onboarding_de_preferencias', async () => {
  useAuthStore.setState({ recienRegistrado: true });
  const { getByTestId } = render(<Onboarding />);

  avanzarHastaElFinal(getByTestId);
  fireEvent.press(getByTestId('onboarding-siguiente'));

  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding-preferencias'));
});
