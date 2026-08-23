import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { OnboardingPreferenciasScreen } from '@/screens/onboarding/OnboardingPreferenciasScreen';
import { feedService } from '@/services/feedService';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/services/feedService', () => ({ feedService: { inicializarPerfil: jest.fn() } }));
jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockReplace = jest.fn();
const mockMarcarOnboardingVisto = jest.fn();
const mockInicializarPerfil = feedService.inicializarPerfil as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockInicializarPerfil.mockResolvedValue(undefined);
  (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
    selector({ marcarOnboardingVisto: mockMarcarOnboardingVisto })
  );
});

it('ofrece_15_tipos_de_cocina_para_elegir', () => {
  const tipos = [
    'Mediterránea', 'Italiana', 'Asiática', 'Mexicana', 'Americana',
    'India', 'China', 'Japonesa', 'Francesa', 'Árabe',
    'Vegetariana', 'Vegana', 'Saludable', 'Económica', 'Rápida y fácil',
  ];
  const { getAllByText } = render(<OnboardingPreferenciasScreen />);

  // "Mediterránea" y "Vegana"/"Vegetariana" se repiten también en la sección de dieta,
  // así que basta con comprobar que cada tipo de cocina aparece al menos una vez.
  tipos.forEach((tipo) => expect(getAllByText(tipo).length).toBeGreaterThanOrEqual(1));
});

it('empezar_envia_los_tipos_de_cocina_seleccionados_y_el_tiempo_disponible', async () => {
  const { getByText, getAllByText } = render(<OnboardingPreferenciasScreen />);

  fireEvent.press(getByText('Japonesa'));
  fireEvent.press(getAllByText('Vegana')[0]);
  fireEvent.press(getByText('30-60 min'));
  fireEvent.press(getByText('Empezar'));

  await waitFor(() => expect(mockInicializarPerfil).toHaveBeenCalledWith(
    ['Japonesa', 'Vegana'], '30_60'
  ));
});

it('empezar_añade_el_tipo_de_dieta_a_los_tipos_de_cocina_si_no_es_Ninguna', async () => {
  const { getByText } = render(<OnboardingPreferenciasScreen />);

  fireEvent.press(getByText('Italiana'));
  fireEvent.press(getByText('Keto'));
  fireEvent.press(getByText('Empezar'));

  await waitFor(() => expect(mockInicializarPerfil).toHaveBeenCalledWith(
    ['Italiana', 'Keto'], null
  ));
});

it('empezar_marca_el_onboarding_como_visto_y_navega_al_dashboard', async () => {
  const { getByText } = render(<OnboardingPreferenciasScreen />);

  fireEvent.press(getByText('Empezar'));

  await waitFor(() => expect(mockMarcarOnboardingVisto).toHaveBeenCalledTimes(1));
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});

it('omitir_por_ahora_navega_sin_llamar_a_inicializarPerfil', () => {
  const { getByText } = render(<OnboardingPreferenciasScreen />);

  fireEvent.press(getByText('Omitir por ahora'));

  expect(mockInicializarPerfil).not.toHaveBeenCalled();
  expect(mockMarcarOnboardingVisto).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});
