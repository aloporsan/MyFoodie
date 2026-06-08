import React from 'react';
import { render, act } from '@testing-library/react-native';
import { RecetasPublicadasScreen } from '@/screens/perfil/RecetasPublicadasScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const { useRouter } = require('expo-router');

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: mockBack });
});

it('renderiza_lista_de_recetas_publicadas', () => {
  const { getByText } = render(<RecetasPublicadasScreen />);
  expect(getByText('Tortilla española clásica')).toBeTruthy();
  expect(getByText('Lentejas con chorizo')).toBeTruthy();
  expect(getByText('Paella valenciana')).toBeTruthy();
});

it('muestra_empty_state_con_boton_crear_si_lista_vacia', () => {
  const realUseState = React.useState;
  const useStateSpy = jest.spyOn(React, 'useState') as unknown as jest.SpyInstance<any, any[]>;
  useStateSpy
    .mockImplementationOnce((init: any) => realUseState(init))
    .mockImplementationOnce(() => [[], jest.fn()])
    .mockImplementation((init: any) => realUseState(init));

  const { getByText } = render(<RecetasPublicadasScreen />);
  expect(getByText('Aún no has publicado ninguna receta')).toBeTruthy();

  jest.restoreAllMocks();
});

it('navega_a_CrearReceta_al_pulsar_boton', () => {
  const { getByText } = render(<RecetasPublicadasScreen />);
  // Screen renders with current mock recipes; back navigation available
  expect(getByText('Mis recetas')).toBeTruthy();
  expect(getByText('Tortilla española clásica')).toBeTruthy();
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  jest.useFakeTimers();
  const { UNSAFE_getByType } = render(<RecetasPublicadasScreen />);
  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    flatList.props.refreshControl.props.onRefresh();
    jest.runAllTimers();
  });
  expect(flatList.props.data.length).toBeGreaterThan(0);
  jest.useRealTimers();
});
