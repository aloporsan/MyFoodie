import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeNotificaciones } from '@/components/notificaciones/BadgeNotificaciones';

it('muestra_el_contador_recibido', () => {
  const { getByText } = render(<BadgeNotificaciones contador={4} />);
  expect(getByText('4')).toBeTruthy();
});

it('muestra_99_mas_si_el_contador_supera_99', () => {
  const { getByText } = render(<BadgeNotificaciones contador={150} />);
  expect(getByText('99+')).toBeTruthy();
});

it('muestra_0_si_no_hay_notificaciones', () => {
  const { getByText } = render(<BadgeNotificaciones contador={0} />);
  expect(getByText('0')).toBeTruthy();
});

it('renderiza_con_el_testID_esperado', () => {
  const { getByTestId } = render(<BadgeNotificaciones contador={1} />);
  expect(getByTestId('badge-notificaciones')).toBeTruthy();
});
