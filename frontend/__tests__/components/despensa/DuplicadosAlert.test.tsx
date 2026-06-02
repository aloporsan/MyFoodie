import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DuplicadosAlert } from '@/components/despensa/DuplicadosAlert';
import { Producto } from '@/services/despensaService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const duplicado: Producto = {
  id: 'prod-0',
  despensaId: 'desp-1',
  nombre: 'Leche Entera',
  cantidad: 3,
  unidad: 'litros',
  estado: 'normal',
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const onAñadirIgualmente    = jest.fn();
const onActualizarExistente = jest.fn();
const onCancelar            = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('renderiza_alerta_cuando_visible_es_true', () => {
  const { getByText } = render(
    <DuplicadosAlert
      visible={true}
      duplicados={[duplicado]}
      onAñadirIgualmente={onAñadirIgualmente}
      onActualizarExistente={onActualizarExistente}
      onCancelar={onCancelar}
    />
  );
  expect(getByText('Producto similar detectado')).toBeTruthy();
});

it('llama_onAñadirIgualmente_al_pulsar_esa_opcion', () => {
  const { getByText } = render(
    <DuplicadosAlert
      visible={true}
      duplicados={[duplicado]}
      onAñadirIgualmente={onAñadirIgualmente}
      onActualizarExistente={onActualizarExistente}
      onCancelar={onCancelar}
    />
  );
  fireEvent.press(getByText('Añadir igualmente'));
  expect(onAñadirIgualmente).toHaveBeenCalledTimes(1);
});

it('llama_onActualizarExistente_con_el_duplicado_al_pulsar_esa_opcion', () => {
  const { getByText } = render(
    <DuplicadosAlert
      visible={true}
      duplicados={[duplicado]}
      onAñadirIgualmente={onAñadirIgualmente}
      onActualizarExistente={onActualizarExistente}
      onCancelar={onCancelar}
    />
  );
  fireEvent.press(getByText('Actualizar cantidad del existente'));
  expect(onActualizarExistente).toHaveBeenCalledWith(duplicado);
});

it('llama_onCancelar_al_pulsar_cancelar', () => {
  const { getByText } = render(
    <DuplicadosAlert
      visible={true}
      duplicados={[duplicado]}
      onAñadirIgualmente={onAñadirIgualmente}
      onActualizarExistente={onActualizarExistente}
      onCancelar={onCancelar}
    />
  );
  fireEvent.press(getByText('Cancelar'));
  expect(onCancelar).toHaveBeenCalledTimes(1);
});
