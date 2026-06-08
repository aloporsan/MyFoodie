import React from 'react';
import { render, act } from '@testing-library/react-native';
import { RecetasGuardadasScreen } from '@/screens/perfil/RecetasGuardadasScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

it('renderiza_lista_de_recetas_guardadas', () => {
  const { getByText } = render(<RecetasGuardadasScreen />);
  expect(getByText('Pasta carbonara')).toBeTruthy();
  expect(getByText('Pollo al horno con verduras')).toBeTruthy();
  expect(getByText('Gazpacho andaluz')).toBeTruthy();
  expect(getByText('Risotto de champiñones')).toBeTruthy();
});

it('muestra_empty_state_si_lista_vacia', () => {
  const realUseState = React.useState;
  const useStateSpy = jest.spyOn(React, 'useState') as unknown as jest.SpyInstance<any, any[]>;
  useStateSpy
    .mockImplementationOnce((init: any) => realUseState(init))
    .mockImplementationOnce(() => [[], jest.fn()])
    .mockImplementation((init: any) => realUseState(init));

  const { getByText } = render(<RecetasGuardadasScreen />);
  expect(getByText('Aún no tienes recetas guardadas')).toBeTruthy();

  jest.restoreAllMocks();
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  jest.useFakeTimers();
  const { UNSAFE_getByType } = render(<RecetasGuardadasScreen />);
  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    flatList.props.refreshControl.props.onRefresh();
    jest.runAllTimers();
  });
  // After refresh the list still has the mock data
  expect(flatList.props.data.length).toBeGreaterThan(0);
  jest.useRealTimers();
});
