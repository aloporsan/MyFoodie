import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { IngredientesFaltantesScreen } from '@/screens/compartir/IngredientesFaltantesScreen';
import { RecetaCompartida, compartirService } from '@/services/compartirService';
import { useCompartirStore } from '@/store/compartirStore';
import { useToastStore } from '@/hooks/useToast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/services/compartirService');

const { useRouter, useLocalSearchParams } = require('expo-router');
const mockCompartirService = compartirService as jest.Mocked<typeof compartirService>;

function recetaCompartida(overrides: Partial<RecetaCompartida> = {}): RecetaCompartida {
  return {
    id: 'comp-1',
    emisor: { nombre: 'Ana García', nombreUsuario: 'anagarcia', fotoPerfil: null },
    receta: {
      id: 'receta-1',
      autorId: 'user-1',
      titulo: 'Ensalada de tomate',
      descripcion: 'Fresca y rápida',
      tiempoEstimado: 10,
      dificultad: 'facil',
      categoria: 'entrante',
      etiquetas: [],
      estado: 'publicada',
      ingredientes: [
        { id: 'ing-1', nombre: 'Tomate', cantidad: 2, unidad: 'unidades' },
        { id: 'ing-2', nombre: 'Pasta', cantidad: 200, unidad: 'g' },
      ],
      pasos: [],
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
    mensaje: null,
    leida: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true });
  useLocalSearchParams.mockReturnValue({ id: 'comp-1' });
  useCompartirStore.setState({
    recetasRecibidas: [recetaCompartida()],
    ingredientesFaltantes: [],
    isLoading: false,
    error: null,
  });
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
  mockCompartirService.obtenerIngredientesFaltantes.mockResolvedValue([
    { nombre: 'Pasta', cantidad: 200, unidad: 'g' },
  ]);
});

it('renderiza_ingredientes_disponibles_en_verde', async () => {
  const { findByText } = render(<IngredientesFaltantesScreen />);

  expect(await findByText('Ingredientes en tu despensa')).toBeTruthy();
  expect(await findByText('Tomate')).toBeTruthy();
});

it('renderiza_ingredientes_faltantes_en_rojo', async () => {
  const { findByText } = render(<IngredientesFaltantesScreen />);

  expect(await findByText('Ingredientes que te faltan')).toBeTruthy();
  expect(await findByText('Pasta')).toBeTruthy();
});

it('boton_añadir_al_carrito_muestra_toast_proximamente', async () => {
  const { findByTestId } = render(<IngredientesFaltantesScreen />);

  const boton = await findByTestId('btn-añadir-carrito');
  await act(async () => {
    fireEvent.press(boton);
  });

  await waitFor(() => {
    expect(useToastStore.getState().mensaje).toBe('Disponible próximamente');
  });
});
