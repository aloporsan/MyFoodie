export const colors = {
  primary: '#7FC62A',
  primaryDark: '#5CA61E',
  secondary: '#F4A000',
  secondaryLight: '#F8B133',

  white: '#FFFFFF',
  grayLight: '#F2F2F2',
  gray: '#E8E8E8',
  grayMid: '#BDBDBD',
  grayDark: '#757575',

  text: {
    primary: '#1A1A1A',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
  background: {
    default: '#FFFFFF',
    surface: '#F2F2F2',
  },

  error: '#E53935',
} as const;

export type Colors = typeof colors;
