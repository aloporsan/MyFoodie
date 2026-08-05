import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { IngredientesFaltantesScreen } from '@/screens/compartir/IngredientesFaltantesScreen';
import { RecetaCompartida, compartirService } from '@/services/compartirService';
import { carritoService } from '@/services/carritoService';
import { useCompartirStore } from '@/store/compartirStore';
import { useCarritoStore } from '@/store/carritoStore';
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
jest.mock('@/services/carritoService');

const { useRouter, useLocalSearchParams } = require('expo-router');
const mockCompartirService = compartirService as jest.Mocked<typeof compartirService>;
const mockCarritoService = carritoService as jest.Mocked<typeof carritoService>;

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
      numPersonas: 2,
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
  useCarritoStore.setState({
    items: [], resumen: null, listas: [], listaActiva: null, listaEnCurso: null,
    isLoading: false, isGenerando: false, error: null,
  });
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

it('boton_añadir_al_carrito_añade_los_ingredientes_faltantes_y_muestra_toast_de_exito', async () => {
  mockCarritoService.añadirItemManual.mockResolvedValue({
    id: 'item-1', usuarioId: 'user-1', nombre: 'Pasta', cantidad: 200, unidad: 'g',
    categoria: null, prioridad: 'media', motivo: null, estado: 'pendiente', noVolver: false,
    recetaId: null, recetaTitulo: null, productoEnDespensa: false,
    createdAt: '2026-01-15T00:00:00.000Z', updatedAt: '2026-01-15T00:00:00.000Z',
  });

  const { findByTestId } = render(<IngredientesFaltantesScreen />);

  const boton = await findByTestId('btn-añadir-carrito');
  await act(async () => {
    fireEvent.press(boton);
  });

  await waitFor(() => {
    expect(mockCarritoService.añadirItemManual).toHaveBeenCalledWith({
      nombre: 'Pasta', cantidad: 200, unidad: 'g',
    });
    expect(useToastStore.getState().mensaje).toBe('1 ingrediente añadido al carrito');
  });
});

it('boton_añadir_al_carrito_muestra_toast_de_error_si_falla_la_peticion', async () => {
  mockCarritoService.añadirItemManual.mockRejectedValue(new Error('Error de red'));

  const { findByTestId } = render(<IngredientesFaltantesScreen />);

  const boton = await findByTestId('btn-añadir-carrito');
  await act(async () => {
    fireEvent.press(boton);
  });

  await waitFor(() => {
    expect(useToastStore.getState().mensaje).toBe('No se pudieron añadir los ingredientes al carrito');
  });
});
