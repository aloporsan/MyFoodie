import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
import { ListaCompraScreen } from '@/screens/carrito/ListaCompraScreen';
import { ListaCompra } from '@/services/carritoService';
import { useCarritoStore } from '@/store/carritoStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/carritoService', () => ({
  ...jest.requireActual('@/services/carritoService'),
  carritoService: {
    obtenerLista: jest.fn(),
    alternarComprado: jest.fn(),
    modificarCantidad: jest.fn(),
    eliminarItem: jest.fn(),
    cancelarLista: jest.fn(),
  },
}));
jest.mock('@/services/pdfService', () => ({
  pdfService: {
    generarPDFListaCompra: jest.fn(),
    compartirPDF: jest.fn(),
  },
}));

const { useRouter, useLocalSearchParams } = require('expo-router');
const { carritoService } = require('@/services/carritoService');
const { pdfService } = require('@/services/pdfService');

function renderPantalla() {
  return render(
    <>
      <ListaCompraScreen />
      <ConfirmModal />
    </>
  );
}

const mockLista: ListaCompra = {
  id: 'l1',
  nombre: 'Compra semanal',
  estado: 'activa',
  items: [
    {
      id: 'i1', usuarioId: 'u1', nombre: 'Leche', cantidad: 2, unidad: 'l',
      categoria: 'lacteos', prioridad: 'alta', motivo: null, estado: 'pendiente',
      noVolver: false, recetaId: null, recetaTitulo: null, productoEnDespensa: false,
      createdAt: '', updatedAt: '',
    },
  ],
  createdAt: '',
  updatedAt: '',
};

const mockBack = jest.fn();
const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: mockBack, replace: mockReplace, canGoBack: () => true });
  useLocalSearchParams.mockReturnValue({ id: 'l1' });
  useCarritoStore.setState({
    items: [], resumen: null, listas: [], listaActiva: null, listaEnCurso: null,
    isLoading: false, isGenerando: false, error: null,
  });
  useConfirmStore.setState({
    visible: false, title: '', message: undefined, icon: undefined, variant: 'default', buttons: [],
  });
  carritoService.obtenerLista.mockResolvedValue(mockLista);
  carritoService.cancelarLista.mockResolvedValue(undefined);
  pdfService.generarPDFListaCompra.mockResolvedValue('file:///lista.pdf');
  pdfService.compartirPDF.mockResolvedValue(undefined);
});

it('boton_exportar_pdf_visible_en_header', async () => {
  const { getByTestId, getByText } = render(<ListaCompraScreen />);
  await waitFor(() => expect(getByText('Compra semanal')).toBeTruthy());
  expect(getByTestId('btn-exportar-pdf')).toBeTruthy();
});

it('pulsar_exportar_genera_y_comparte_el_pdf', async () => {
  const { getByTestId, getByText } = render(<ListaCompraScreen />);
  await waitFor(() => expect(getByText('Compra semanal')).toBeTruthy());

  await act(async () => {
    fireEvent.press(getByTestId('btn-exportar-pdf'));
  });

  await waitFor(() => {
    expect(pdfService.generarPDFListaCompra).toHaveBeenCalledWith(mockLista);
    expect(pdfService.compartirPDF).toHaveBeenCalledWith('file:///lista.pdf', 'Compra semanal.pdf');
  });
});

it('boton_cancelar_lista_visible_si_no_esta_completada', async () => {
  const { getByTestId, getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Compra semanal')).toBeTruthy());
  expect(getByTestId('btn-cancelar-lista')).toBeTruthy();
});

it('boton_cancelar_lista_no_aparece_si_la_lista_esta_completada', async () => {
  carritoService.obtenerLista.mockResolvedValue({ ...mockLista, estado: 'completada' });
  const { getByText, queryByTestId } = renderPantalla();
  await waitFor(() => expect(getByText('Compra semanal')).toBeTruthy());
  expect(queryByTestId('btn-cancelar-lista')).toBeNull();
});

it('pulsar_cancelar_pide_confirmacion_y_al_aceptar_cancela_la_lista_y_vuelve_atras', async () => {
  const { getByTestId, getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Compra semanal')).toBeTruthy());

  fireEvent.press(getByTestId('btn-cancelar-lista'));
  expect(getByText('¿Seguro que quieres cancelar esta lista? Dejará de aparecer como compra en curso.')).toBeTruthy();

  await act(async () => {
    fireEvent.press(getByTestId('confirm-modal-btn-1'));
  });

  expect(carritoService.cancelarLista).toHaveBeenCalledWith('l1');
  expect(mockBack).toHaveBeenCalled();
});
