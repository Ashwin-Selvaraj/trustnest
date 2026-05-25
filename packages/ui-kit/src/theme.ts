/**
 * TrustNest design tokens — colours, spacing, typography.
 * Import from here rather than hardcoding hex values in components.
 */
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  secondary: '#6B7280',
  secondaryLight: '#F3F4F6',
  destructive: '#DC2626',
  destructiveLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  info: '#0891B2',
  infoLight: '#ECFEFF',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  borderFocus: '#2563EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  fontSizeXs: 11,
  fontSizeSm: 13,
  fontSizeBase: 15,
  fontSizeLg: 17,
  fontSizeXl: 20,
  fontSize2xl: 24,
  fontSize3xl: 30,
  lineHeightSm: 18,
  lineHeightBase: 22,
  lineHeightLg: 26,
  lineHeightXl: 30,
  fontWeightNormal: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
} as const;
