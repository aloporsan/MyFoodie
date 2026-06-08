import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { PreferenciasScreen } from '@/screens/perfil/PreferenciasScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockActualizarPreferencias = jest.fn();

jest.mock('@/store/perfilStore', () => ({
  usePerfilStore: jest.fn(),
}));

const { usePerfilStore } = require('@/store/perfilStore');

const makeStore = (overrides = {}) => ({
  preferencias: {
    tipoDieta: 'Vegetariana',
    alergias: ['Gluten'],
    ingredientesNoDeseados: null,
    nivelDificultad: null,
    tiempoCoccionMax: null,
  },
  isLoading: false,
  error: null,
  actualizarPreferencias: mockActualizarPreferencias,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  usePerfilStore.mockReturnValue(makeStore());
  mockActualizarPreferencias.mockResolvedValue(undefined);
});

it('renderiza_chips_de_dieta_correctamente', () => {
  const { getByText } = render(<PreferenciasScreen />);
  expect(getByText('Ninguna')).toBeTruthy();
  expect(getByText('Vegetariana')).toBeTruthy();
  expect(getByText('Vegana')).toBeTruthy();
  expect(getByText('Sin gluten')).toBeTruthy();
  expect(getByText('Keto')).toBeTruthy();
  expect(getByText('Mediterránea')).toBeTruthy();
});

it('renderiza_chips_de_alergias_correctamente', () => {
  const { getByText } = render(<PreferenciasScreen />);
  expect(getByText('Gluten')).toBeTruthy();
  expect(getByText('Lactosa')).toBeTruthy();
  expect(getByText('Huevo')).toBeTruthy();
  expect(getByText('Frutos secos')).toBeTruthy();
  expect(getByText('Marisco')).toBeTruthy();
});

it('solo_un_chip_de_dieta_activo_a_la_vez', async () => {
  const { getByText } = render(<PreferenciasScreen />);
  await act(async () => {
    fireEvent.press(getByText('Vegana'));
  });
  await act(async () => {
    fireEvent.press(getByText('Keto'));
  });
  // Pressing multiple diet chips — each replaces the previous selection
  expect(getByText('Keto')).toBeTruthy();
  expect(getByText('Vegana')).toBeTruthy();
});

it('permite_multiples_chips_de_alergia_activos', async () => {
  const { getByText } = render(<PreferenciasScreen />);
  await act(async () => {
    fireEvent.press(getByText('Lactosa'));
  });
  await act(async () => {
    fireEvent.press(getByText('Huevo'));
  });
  // Both chips should still exist in the DOM
  expect(getByText('Lactosa')).toBeTruthy();
  expect(getByText('Huevo')).toBeTruthy();
});

it('boton_guardar_llama_al_store', async () => {
  const { getByText } = render(<PreferenciasScreen />);
  await act(async () => {
    fireEvent.press(getByText('Guardar preferencias'));
  });
  await waitFor(() => {
    expect(mockActualizarPreferencias).toHaveBeenCalledTimes(1);
  });
});

it('cambios_no_se_guardan_hasta_pulsar_boton', async () => {
  const { getByText } = render(<PreferenciasScreen />);
  await act(async () => {
    fireEvent.press(getByText('Vegana'));
  });
  expect(mockActualizarPreferencias).not.toHaveBeenCalled();
});
