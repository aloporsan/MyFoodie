import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { HistorialInteraccionesScreen } from '@/screens/perfil/HistorialInteraccionesScreen';
import { historialService } from '@/services/historialService';
import { Receta } from '@/services/recetaService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/utils/media', () => ({ resolveImagenUrl: (u: string | null) => u ?? null }));
jest.mock('@/services/historialService');

const mockHistorialService = historialService as jest.Mocked<typeof historialService>;

function receta(id: string, titulo: string): Receta {
  return {
    id,
    autorId: 'autor-1',
    titulo,
    descripcion: 'desc',
    tiempoEstimado: 20,
    dificultad: 'Fácil',
    categoria: 'plato',
    numPersonas: 2,
    etiquetas: [],
    estado: 'publicada',
    ingredientes: [],
    pasos: [],
    totalLikes: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHistorialService.obtenerHistorialRecetas.mockResolvedValue([receta('r-1', 'Receta guardada')]);
});

it('carga_la_pestaña_guardadas_por_defecto', async () => {
  const { findByText } = render(<HistorialInteraccionesScreen />);
  expect(await findByText('Receta guardada')).toBeTruthy();
  expect(mockHistorialService.obtenerHistorialRecetas).toHaveBeenCalledWith('guardadas');
});

it('cambia_de_tab_correctamente', async () => {
  const { findByText, getByText } = render(<HistorialInteraccionesScreen />);
  await findByText('Receta guardada');

  await act(async () => {
    fireEvent.press(getByText('Like'));
  });

  await waitFor(() => {
    expect(mockHistorialService.obtenerHistorialRecetas).toHaveBeenLastCalledWith('like');
  });
});

it('renderiza_vistas_recientemente_sin_duplicados', async () => {
  mockHistorialService.obtenerHistorialRecetas.mockImplementation(async (tipo) =>
    tipo === 'vistas'
      ? [receta('r-a', 'Tarta de manzana'), receta('r-b', 'Sopa de tomate')]
      : [receta('r-1', 'Receta guardada')],
  );

  const { findByText, getByText, queryAllByText } = render(<HistorialInteraccionesScreen />);
  await findByText('Receta guardada');

  await act(async () => {
    fireEvent.press(getByText('Vistas'));
  });

  await findByText('Tarta de manzana');
  expect(getByText('Sopa de tomate')).toBeTruthy();
  expect(queryAllByText('Tarta de manzana')).toHaveLength(1);
});
