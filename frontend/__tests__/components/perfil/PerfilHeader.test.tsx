import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PerfilHeader } from '@/components/perfil/PerfilHeader';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

const mockPerfil = {
  id: 'user-1',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  email: 'ana@example.com',
  fotoPerfil: null,
  biografia: null,
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('renderiza_nombre_y_nombreUsuario_correctamente', () => {
  const { getByText } = render(<PerfilHeader perfil={mockPerfil} />);
  expect(getByText('Ana García')).toBeTruthy();
  expect(getByText('@anagarcia')).toBeTruthy();
});

it('renderiza_placeholder_si_no_hay_foto', () => {
  const { getByText } = render(<PerfilHeader perfil={mockPerfil} />);
  expect(getByText('AG')).toBeTruthy();
});

it('renderiza_foto_si_existe_url', () => {
  const perfilConFoto = { ...mockPerfil, fotoPerfil: 'https://example.com/foto.jpg' };
  const { queryByText } = render(<PerfilHeader perfil={perfilConFoto} />);
  expect(queryByText('AG')).toBeNull();
});

it('renderiza_fecha_registro_formateada', () => {
  const { getByText } = render(<PerfilHeader perfil={mockPerfil} />);
  expect(getByText(/Miembro desde/)).toBeTruthy();
});

it('llama_onEditarPerfil_al_pulsar_boton', () => {
  const { getByText } = render(<PerfilHeader perfil={mockPerfil} />);
  fireEvent.press(getByText('Editar perfil'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/editar');
});
