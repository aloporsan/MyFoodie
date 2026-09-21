import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { DetalleRecetaScreen } from '@/screens/receta/DetalleRecetaScreen';
import { useRecetaStore } from '@/store/recetaStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/services/recetaService', () => ({
  recetaService: {
    obtenerReceta: jest.fn(),
    eliminarReceta: jest.fn(),
    recetasGuardadas: jest.fn(),
    guardarReceta: jest.fn(),
  },
}));
jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('@/services/pdfService', () => ({
  pdfService: {
    generarPDFReceta: jest.fn(),
    compartirPDF: jest.fn(),
  },
}));

const mockReceta = {
  id: 'r1', autorId: 'u1', titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional', tiempoEstimado: 60,
  dificultad: 'Difícil', categoria: 'Arroces', numPersonas: 4, etiquetas: [],
  estado: 'publicada' as const, ingredientes: [], pasos: [],
  createdAt: '', updatedAt: '',
};

const mockRecetaConDatos = {
  ...mockReceta,
  ingredientes: [
    { id: 'ing1', nombre: 'Arroz', cantidad: 200, unidad: 'g' },
    { id: 'ing2', nombre: 'Azafrán', cantidad: 1, unidad: 'pizca' },
  ],
  pasos: [
    { id: 'p1', orden: 1, descripcion: 'Sofreír el pollo' },
    { id: 'p2', orden: 2, descripcion: 'Añadir el arroz' },
  ],
};

const { useRouter, useLocalSearchParams } = require('expo-router');
const { recetaService } = require('@/services/recetaService');
const { useAuthStore } = require('@/store/authStore');
const { pdfService } = require('@/services/pdfService');

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRecetaStore.setState({ recetaActual: null, recetasGuardadas: [], error: null, isLoading: false });
  useRouter.mockReturnValue({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true });
  useLocalSearchParams.mockReturnValue({ id: 'r1' });
  recetaService.obtenerReceta.mockResolvedValue(mockReceta);
  recetaService.recetasGuardadas.mockResolvedValue([]);
  recetaService.guardarReceta.mockResolvedValue(undefined);
  useAuthStore.mockReturnValue('u1');
  pdfService.generarPDFReceta.mockResolvedValue('file:///receta.pdf');
  pdfService.compartirPDF.mockResolvedValue(undefined);
});

it('muestra_indicador_de_carga_al_inicio', () => {
  const { getByTestId } = render(<DetalleRecetaScreen />);
  expect(getByTestId('loading-screen-logo')).toBeTruthy();
});

it('muestra_titulo_de_receta_tras_cargar', async () => {
  const { getAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0);
  });
});

it('muestra_descripcion_tras_cargar', async () => {
  const { getByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Receta tradicional')).toBeTruthy();
  });
});

it('detalle_muestra_para_X_personas', async () => {
  const { getByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Para 4 personas')).toBeTruthy();
  });
});

it('muestra_error_si_el_servicio_falla', async () => {
  recetaService.obtenerReceta.mockRejectedValue(new Error('No encontrada'));
  const { getByTestId } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByTestId('error-screen')).toBeTruthy();
  });
});

it('renderiza_todos_los_pasos_numerados', async () => {
  recetaService.obtenerReceta.mockResolvedValue(mockRecetaConDatos);
  const { getByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Sofreír el pollo')).toBeTruthy();
    expect(getByText('Añadir el arroz')).toBeTruthy();
  });
});

it('renderiza_todos_los_ingredientes_con_cantidad_y_unidad', async () => {
  recetaService.obtenerReceta.mockResolvedValue(mockRecetaConDatos);
  const { getByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Arroz')).toBeTruthy();
    expect(getByText('200 g')).toBeTruthy();
    expect(getByText('Azafrán')).toBeTruthy();
    expect(getByText('1 pizca')).toBeTruthy();
  });
});

it('muestra_botones_editar_y_eliminar_si_es_autor', async () => {
  const { getByTestId, getAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0));
  expect(getByTestId('btn-editar-receta')).toBeTruthy();
  expect(getByTestId('btn-eliminar-receta')).toBeTruthy();
});

it('muestra_boton_guardar_si_no_es_autor_y_no_esta_guardada', async () => {
  const recetaAjena = { ...mockReceta, autorId: 'u2' };
  recetaService.obtenerReceta.mockResolvedValue(recetaAjena);
  recetaService.recetasGuardadas.mockResolvedValue([]);
  const { getByText, queryByTestId } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getByText('Guardar receta')).toBeTruthy());
  expect(queryByTestId('btn-editar-receta')).toBeNull();
});

it('muestra_boton_guardada_deshabilitado_si_ya_esta_guardada', async () => {
  const recetaAjena = { ...mockReceta, autorId: 'u2' };
  recetaService.obtenerReceta.mockResolvedValue(recetaAjena);
  recetaService.recetasGuardadas.mockResolvedValue([recetaAjena]);
  const { getByText, getByTestId } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getByText('Guardada')).toBeTruthy());
  expect(getByTestId('btn-guardar-receta').props.accessibilityState?.disabled).toBe(true);
});

it('navega_a_EditarReceta_al_pulsar_editar', async () => {
  const { getByTestId, getAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0));
  fireEvent.press(getByTestId('btn-editar-receta'));
  expect(mockPush).toHaveBeenCalledWith('/receta/editar?id=r1');
});

it('datos_actualizados_automaticamente_al_volver_de_editar', async () => {
  const { getAllByText, queryAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0));

  act(() => {
    useRecetaStore.setState({ recetaActual: { ...mockReceta, titulo: 'Paella actualizada' } });
  });

  await waitFor(() => {
    expect(queryAllByText('Paella valenciana').length).toBe(0);
    expect(getAllByText('Paella actualizada').length).toBeGreaterThan(0);
  });
});

it('boton_exportar_pdf_visible_en_header', async () => {
  const { getByTestId, getAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0));
  expect(getByTestId('btn-exportar-pdf')).toBeTruthy();
});

it('pulsar_exportar_muestra_loading_overlay_mientras_genera_el_pdf', async () => {
  let resolverPdf: (uri: string) => void = () => {};
  pdfService.generarPDFReceta.mockImplementation(
    () => new Promise((resolve) => { resolverPdf = resolve; })
  );

  const { getByTestId, getAllByText, queryByTestId } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0));
  expect(queryByTestId('loading-overlay')).toBeNull();

  fireEvent.press(getByTestId('btn-exportar-pdf'));
  await waitFor(() => expect(getByTestId('loading-overlay')).toBeTruthy());

  await act(async () => {
    resolverPdf('file:///receta.pdf');
  });
  await waitFor(() => expect(queryByTestId('loading-overlay')).toBeNull());
});

it('tras_generar_el_pdf_abre_el_dialogo_de_compartir', async () => {
  const { getByTestId, getAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0));

  await act(async () => {
    fireEvent.press(getByTestId('btn-exportar-pdf'));
  });

  await waitFor(() => {
    expect(pdfService.generarPDFReceta).toHaveBeenCalledWith(mockReceta);
    expect(pdfService.compartirPDF).toHaveBeenCalledWith('file:///receta.pdf', 'Paella valenciana.pdf');
  });
});
