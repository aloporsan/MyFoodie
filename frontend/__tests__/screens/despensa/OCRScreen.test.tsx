import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { OCRScreen } from '@/screens/despensa/OCRScreen';
import { ocrService } from '@/services/ocrService';
import { useOCRStore } from '@/store/ocrStore';
import { useToastStore } from '@/hooks/useToast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
  getAuthToken: jest.fn(),
  getServerBaseUrl: jest.fn(),
}));
jest.mock('@/services/ocrService');

const mockImagenAEnviar = { current: null as any };

jest.mock('@/components/ocr/SelectorImagenTicket', () => {
  const { Pressable, Text } = require('react-native');
  return {
    SelectorImagenTicket: ({ onSeleccionarImagen }: any) => (
      <Pressable
        testID="seleccionar-imagen-stub"
        onPress={() => onSeleccionarImagen(mockImagenAEnviar.current)}
      >
        <Text>seleccionar imagen</Text>
      </Pressable>
    ),
  };
});

const mockAjusteAEnviar = { current: null as any };

jest.mock('@/components/ocr/OCRResultadoCard', () => {
  const { Pressable, Text } = require('react-native');
  return {
    OCRResultadoCard: ({ resultado, onChange }: any) => (
      <Pressable
        testID={`enviar-ajuste-${resultado.productoTicket.nombreDetectado}`}
        onPress={() => onChange(mockAjusteAEnviar.current)}
      >
        <Text>{resultado.productoTicket.nombreDetectado}</Text>
      </Pressable>
    ),
  };
});

const mockOcr = ocrService as jest.Mocked<typeof ocrService>;
const { useRouter } = require('expo-router');

const imagenValida = { uri: 'file://ticket.jpg', nombre: 'ticket.jpg', tipo: 'image/jpeg' };

const productoExistente = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Tomate',
  cantidad: 1,
  unidad: 'unidad',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const resultadoNuevo = {
  productoTicket: { nombreDetectado: 'Tomate Frito', cantidadDetectada: 2, unidadDetectada: null, lineaOriginal: '2 TOMATE FRITO' },
  accion: 'nuevo' as const,
  productoExistente: null,
  similitud: null,
  mensajeSugerencia: null,
};

const resultadoActualizado = {
  productoTicket: { nombreDetectado: 'Tomate', cantidadDetectada: 1, unidadDetectada: null, lineaOriginal: 'TOMATE' },
  accion: 'actualizado' as const,
  productoExistente,
  similitud: 0.95,
  mensajeSugerencia: null,
};

const resultadoSugerencia = {
  productoTicket: { nombreDetectado: 'Tomate Ensalada', cantidadDetectada: 1, unidadDetectada: null, lineaOriginal: 'TOMATE ENSALADA' },
  accion: 'sugerencia' as const,
  productoExistente,
  similitud: 0.7,
  mensajeSugerencia: "¿Es lo mismo que 'Tomate'?",
};

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) };

beforeEach(() => {
  jest.clearAllMocks();
  useOCRStore.setState({ resultados: [], isProcessing: false, isConfirming: false, error: null });
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
  useRouter.mockReturnValue(mockRouter);
  mockImagenAEnviar.current = imagenValida;
  mockAjusteAEnviar.current = null;
});

const seleccionarImagenYProcesar = async (getByTestId: any, getByText: any) => {
  fireEvent.press(getByTestId('seleccionar-imagen-stub'));
  fireEvent.press(getByText('Procesar ticket'));
  await waitFor(() => expect(mockOcr.procesarTicket).toHaveBeenCalled());
};

// -------------------------------------------------------------------------
// handleProcesar
// -------------------------------------------------------------------------

it('procesar_manda_la_imagen_como_FormData_y_pasa_a_la_pantalla_de_revision', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoNuevo]);
  const { getByTestId, getByText } = render(<OCRScreen />);

  await seleccionarImagenYProcesar(getByTestId, getByText);

  expect(mockOcr.procesarTicket).toHaveBeenCalledWith(expect.any(FormData));
  await waitFor(() => expect(getByText('Hemos encontrado 1 producto en tu ticket')).toBeTruthy());
});

it('procesar_sin_productos_detectados_muestra_un_aviso_informativo', async () => {
  mockOcr.procesarTicket.mockResolvedValue([]);
  const { getByTestId, getByText } = render(<OCRScreen />);

  await seleccionarImagenYProcesar(getByTestId, getByText);

  await waitFor(() => expect(useToastStore.getState().tipo).toBe('info'));
  expect(useToastStore.getState().mensaje).toContain('No hemos detectado ningún producto');
});

it('procesar_si_falla_muestra_el_error_del_store', async () => {
  mockOcr.procesarTicket.mockRejectedValue(new Error('No se pudo conectar con Google Vision API'));
  const { getByTestId, getByText } = render(<OCRScreen />);

  fireEvent.press(getByTestId('seleccionar-imagen-stub'));
  fireEvent.press(getByText('Procesar ticket'));

  await waitFor(() => expect(useToastStore.getState().tipo).toBe('error'));
  expect(useToastStore.getState().mensaje).toBe('No se pudo conectar con Google Vision API');
});

// -------------------------------------------------------------------------
// handleConfirmar — construcción del producto confirmado según la acción
// -------------------------------------------------------------------------

it('confirmar_un_producto_nuevo_sin_ajuste_usa_los_datos_detectados_del_ticket', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoNuevo]);
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 1, actualizados: 0, ignorados: 0 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockOcr.confirmarProductos).toHaveBeenCalled());
  expect(mockOcr.confirmarProductos).toHaveBeenCalledWith([
    expect.objectContaining({
      nombre: 'Tomate Frito',
      cantidad: 2,
      unidad: 'unidad',
      accion: 'nuevo',
      productoExistenteId: null,
      marca: null,
      notas: null,
      stockMinimo: null,
      categoria: null,
    }),
  ]);
});

it('confirmar_un_producto_nuevo_con_ajuste_incluye_categoria_marca_notas_y_stock', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoNuevo]);
  mockAjusteAEnviar.current = {
    nombre: 'Tomate Frito Solís', cantidad: 2, unidad: 'unidad', fechaCaducidad: null,
    ignorado: false, confirmaSugerencia: null,
    marca: 'Solís', notas: 'Para la boloñesa', stockMinimo: 2, categoria: 'Conservas',
  };
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 1, actualizados: 0, ignorados: 0 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByTestId('enviar-ajuste-Tomate Frito'));
  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockOcr.confirmarProductos).toHaveBeenCalled());
  expect(mockOcr.confirmarProductos).toHaveBeenCalledWith([
    expect.objectContaining({
      nombre: 'Tomate Frito Solís', marca: 'Solís', notas: 'Para la boloñesa',
      stockMinimo: 2, categoria: 'Conservas', accion: 'nuevo',
    }),
  ]);
});

it('confirmar_un_match_automatico_del_backend_actualiza_el_producto_existente', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoActualizado]);
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 0, actualizados: 1, ignorados: 0 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockOcr.confirmarProductos).toHaveBeenCalled());
  expect(mockOcr.confirmarProductos).toHaveBeenCalledWith([
    expect.objectContaining({
      accion: 'actualizado', productoExistenteId: 'prod-1',
      marca: null, notas: null, stockMinimo: null, categoria: null,
    }),
  ]);
});

it('confirmar_una_sugerencia_aceptada_por_el_usuario_actualiza_el_producto_existente', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoSugerencia]);
  mockAjusteAEnviar.current = {
    nombre: 'Tomate Ensalada', cantidad: 1, unidad: 'unidad', fechaCaducidad: null,
    ignorado: false, confirmaSugerencia: true,
    marca: null, notas: null, stockMinimo: null, categoria: null,
  };
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 0, actualizados: 1, ignorados: 0 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByTestId('enviar-ajuste-Tomate Ensalada'));
  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockOcr.confirmarProductos).toHaveBeenCalled());
  expect(mockOcr.confirmarProductos).toHaveBeenCalledWith([
    expect.objectContaining({ accion: 'actualizado', productoExistenteId: 'prod-1' }),
  ]);
});

it('confirmar_una_sugerencia_rechazada_por_el_usuario_lo_trata_como_producto_nuevo', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoSugerencia]);
  mockAjusteAEnviar.current = {
    nombre: 'Tomate Ensalada', cantidad: 1, unidad: 'unidad', fechaCaducidad: null,
    ignorado: false, confirmaSugerencia: false,
    marca: null, notas: null, stockMinimo: null, categoria: null,
  };
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 1, actualizados: 0, ignorados: 0 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByTestId('enviar-ajuste-Tomate Ensalada'));
  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockOcr.confirmarProductos).toHaveBeenCalled());
  expect(mockOcr.confirmarProductos).toHaveBeenCalledWith([
    expect.objectContaining({ accion: 'nuevo', productoExistenteId: null }),
  ]);
});

it('confirmar_con_ajuste_ignorado_manda_accion_ignorado_aunque_hubiera_match', async () => {
  // Se necesita otro producto sin ignorar en el mismo ticket: si el único producto se
  // ignora, "Añadir a despensa" se deshabilita (0 productos que añadir) y no se podría pulsar.
  mockOcr.procesarTicket.mockResolvedValue([resultadoActualizado, resultadoNuevo]);
  mockAjusteAEnviar.current = {
    nombre: 'Tomate', cantidad: 1, unidad: 'unidad', fechaCaducidad: null,
    ignorado: true, confirmaSugerencia: null,
    marca: null, notas: null, stockMinimo: null, categoria: null,
  };
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 1, actualizados: 0, ignorados: 1 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByTestId('enviar-ajuste-Tomate'));
  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockOcr.confirmarProductos).toHaveBeenCalled());
  expect(mockOcr.confirmarProductos).toHaveBeenCalledWith([
    expect.objectContaining({ nombre: 'Tomate', accion: 'ignorado', productoExistenteId: null }),
    expect.objectContaining({ nombre: 'Tomate Frito', accion: 'nuevo' }),
  ]);
});

// -------------------------------------------------------------------------
// handleConfirmar — resultado de la operación
// -------------------------------------------------------------------------

it('confirmar_con_exito_muestra_el_resumen_y_navega_a_despensa', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoNuevo]);
  mockOcr.confirmarProductos.mockResolvedValue({ añadidos: 2, actualizados: 1, ignorados: 0 });
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/despensa'));
  expect(useToastStore.getState().tipo).toBe('success');
  expect(useToastStore.getState().mensaje).toBe('2 productos añadidos, 1 actualizado, 0 ignorados');
});

it('confirmar_si_falla_muestra_el_error_del_store_y_no_navega', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultadoNuevo]);
  mockOcr.confirmarProductos.mockRejectedValue(new Error('Ya existe un producto con ese nombre'));
  const { getByText, getByTestId } = render(<OCRScreen />);
  await seleccionarImagenYProcesar(getByTestId, getByText);

  fireEvent.press(getByText('Añadir a despensa'));

  await waitFor(() => expect(useToastStore.getState().tipo).toBe('error'));
  expect(useToastStore.getState().mensaje).toBe('Ya existe un producto con ese nombre');
  expect(mockRouter.replace).not.toHaveBeenCalled();
});
