import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { RecetaCompartidaCard } from '@/components/compartir/RecetaCompartidaCard';
import { RecetaCompartida, compartirService } from '@/services/compartirService';
import { useCompartirStore } from '@/store/compartirStore';
import { useToastStore } from '@/hooks/useToast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/services/compartirService');

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
      numPersonas: 2,
      etiquetas: [],
      estado: 'publicada',
      ingredientes: [],
      pasos: [],
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
    mensaje: null,
    leida: false,
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

const onVerReceta = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useCompartirStore.setState({ recetasRecibidas: [], contadorNoLeidas: 0, isLoading: false, error: null });
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
});

it('renderiza_datos_del_emisor_y_receta', () => {
  const { getByText } = render(
    <RecetaCompartidaCard recetaCompartida={recetaCompartida()} onVerReceta={onVerReceta} />
  );

  expect(getByText('Ana García')).toBeTruthy();
  expect(getByText('@anagarcia')).toBeTruthy();
  expect(getByText('Ensalada de tomate')).toBeTruthy();
});

it('muestra_mensaje_si_existe', () => {
  const { getByTestId } = render(
    <RecetaCompartidaCard
      recetaCompartida={recetaCompartida({ mensaje: 'Prueba esta receta' })}
      onVerReceta={onVerReceta}
    />
  );

  expect(getByTestId('mensaje-emisor').props.children.join('')).toContain('Prueba esta receta');
});

it('muestra_badge_nueva_si_no_leida', () => {
  const { getByText } = render(
    <RecetaCompartidaCard recetaCompartida={recetaCompartida({ leida: false })} onVerReceta={onVerReceta} />
  );

  expect(getByText('Nueva')).toBeTruthy();
});

it('no_muestra_badge_si_leida', () => {
  const { queryByText } = render(
    <RecetaCompartidaCard recetaCompartida={recetaCompartida({ leida: true })} onVerReceta={onVerReceta} />
  );

  expect(queryByText('Nueva')).toBeNull();
});

it('llama_guardarRecetaCompartida_al_pulsar_guardar', async () => {
  mockCompartirService.guardarRecetaCompartida.mockResolvedValue(undefined);
  const { getByText } = render(
    <RecetaCompartidaCard recetaCompartida={recetaCompartida({ id: 'comp-1' })} onVerReceta={onVerReceta} />
  );

  await act(async () => {
    fireEvent.press(getByText('Guardar receta'));
  });

  expect(mockCompartirService.guardarRecetaCompartida).toHaveBeenCalledWith('comp-1');
});

it('navega_a_detalle_al_pulsar_ver_receta', () => {
  const { getByText } = render(
    <RecetaCompartidaCard recetaCompartida={recetaCompartida()} onVerReceta={onVerReceta} />
  );

  fireEvent.press(getByText('Ver receta'));

  expect(onVerReceta).toHaveBeenCalledTimes(1);
});
