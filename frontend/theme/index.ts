export { colors } from './colors';
export { typography, fontFamily } from './typography';
export { spacing } from './spacing';
export { borderRadius } from './borderRadius';
export { shadows } from './shadows';

import { colors } from './colors';
import { typography, fontFamily } from './typography';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
} as const;
