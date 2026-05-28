import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
} as const;

export const typography = {
  fontFamily,

  display: {
    fontFamily: fontFamily.semiBold,
    fontSize: 32,
    lineHeight: 40,
  } as TextStyle,

  heading1: {
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    lineHeight: 32,
  } as TextStyle,

  heading2: {
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,

  heading3: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
  } as TextStyle,
} as const;
