import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ModalFusion } from '@/components/despensa/ModalFusion';
import { ParDuplicado } from '@/services/matchingService';
import { useFusionStore } from '@/store/fusionStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/store/fusionStore');

const mockUseFusionStore = useFusionStore as unknown as jest.Mock;
const fusionarProductos = jest.fn().mockResolvedValue(undefined);
const onClose = jest.fn();

const producto = (overrides: Partial<ParDuplicado['productoA']>) => ({
  id: 'p1',
  despensaId: 'desp-1',
  nombre: 'Leche',
  cantidad: 2,
  unidad: 'l',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  fusionarProductos.mockResolvedValue(undefined);
  mockUseFusionStore.mockReturnValue({ fusionarProductos, isLoading: false });
});

it('no_renderiza_nada_si_par_es_null', () => {
  const { queryByText } = render(<ModalFusion visible par={null} onClose={onClose} />);
  expect(queryByText('Fusionar productos')).toBeNull();
});

it('muestra_el_nombre_completo_y_la_cantidad_de_ambos_productos', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1', nombre: 'Aceitunas Gordales Rellenas de Anchoa', cantidad: 2, unidad: 'l' }),
    productoB: producto({ id: 'p2', nombre: 'Aceitunas Gordale', cantidad: 500, unidad: 'ml' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { getByText } = render(<ModalFusion visible par={par} onClose={onClose} />);

  expect(getByText('Aceitunas Gordales Rellenas de Anchoa')).toBeTruthy();
  expect(getByText('Aceitunas Gordale')).toBeTruthy();
});

it('no_muestra_selector_de_unidad_ni_de_fecha_si_ambos_productos_coinciden', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1', unidad: 'l', fechaCaducidad: '2026-03-01' }),
    productoB: producto({ id: 'p2', unidad: 'l', fechaCaducidad: '2026-03-01' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { queryByText } = render(<ModalFusion visible par={par} onClose={onClose} />);

  expect(queryByText('¿Qué unidad quieres usar?')).toBeNull();
  expect(queryByText('¿Qué fecha de caducidad quieres conservar?')).toBeNull();
});

it('muestra_selectores_de_unidad_y_fecha_cuando_los_productos_difieren', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1', unidad: 'l', fechaCaducidad: '2026-03-01' }),
    productoB: producto({ id: 'p2', unidad: 'ml', fechaCaducidad: '2026-01-10' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { getByText } = render(<ModalFusion visible par={par} onClose={onClose} />);

  expect(getByText('¿Qué unidad quieres usar?')).toBeTruthy();
  expect(getByText('¿Qué fecha de caducidad quieres conservar?')).toBeTruthy();
});

it('calcula_la_cantidad_total_convirtiendo_a_la_unidad_resultante_en_vez_de_sumar_en_crudo', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1', cantidad: 2, unidad: 'l' }),
    productoB: producto({ id: 'p2', cantidad: 500, unidad: 'ml' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { getByText } = render(<ModalFusion visible par={par} onClose={onClose} />);

  // 2 l + 500 ml convertidos a la unidad resultante (l, la del producto conservado por defecto) = 2.5 l
  expect(getByText(/tendrá 2.5 l/)).toBeTruthy();
});

it('fusionar_con_productos_iguales_no_envia_overrides_de_unidad_ni_fecha', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1', unidad: 'l' }),
    productoB: producto({ id: 'p2', unidad: 'l' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { getByText } = render(<ModalFusion visible par={par} onClose={onClose} />);
  fireEvent.press(getByText('Fusionar'));

  expect(fusionarProductos).toHaveBeenCalledWith('p1', 'p2', undefined, undefined);
});

it('fusionar_con_unidades_distintas_envia_la_unidad_elegida', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1', unidad: 'l' }),
    productoB: producto({ id: 'p2', unidad: 'ml' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { getByText } = render(<ModalFusion visible par={par} onClose={onClose} />);
  fireEvent.press(getByText('Fusionar'));

  expect(fusionarProductos).toHaveBeenCalledWith('p1', 'p2', 'l', undefined);
});

it('cerrar_con_cancelar_no_llama_a_fusionarProductos', () => {
  const par: ParDuplicado = {
    productoA: producto({ id: 'p1' }),
    productoB: producto({ id: 'p2' }),
    similitud: 0.9,
    sugerencia: '¿Fusionar?',
  };

  const { getByText } = render(<ModalFusion visible par={par} onClose={onClose} />);
  fireEvent.press(getByText('Cancelar'));

  expect(fusionarProductos).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});
