/**
 * TrustNest design tokens — aligned 1-to-1 with design-reference/tokens.js.
 *
 * Quick reference:
 *   colors.*       — all named colours from the spec
 *   fontSize.*     — xs(11) sm(13) md(15) base(17) lg(20) xl(24) xxl(30)
 *   fontWeight.*   — regular medium semibold bold
 *   spacing.*      — 1(4) 2(8) 3(12) 4(16) 5(20) 6(24) 8(32) 12(48)
 *   borderRadius.* — xs(4) sm(8) md(12) lg(16) full(9999)
 *   shadow.*       — card | fab | sheet  (RN shadow props, spread onto styles)
 *
 * The `typography` export is kept as a legacy alias so older component imports
 * compile without changes during the migration.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Primary
  primary:       '#2563EB',
  primaryDark:   '#1D4ED8',
  primaryLight:  '#EFF6FF',
  primaryBorder: '#BFDBFE',
  // Neutral surface
  bg:            '#FFFFFF',
  surface:       '#F9FAFB',
  border:        '#E5E7EB',
  borderStrong:  '#D1D5DB',
  // Text
  text:          '#111827',
  textSec:       '#6B7280',
  textDis:       '#9CA3AF',
  // Success
  success:       '#16A34A',
  successLight:  '#F0FDF4',
  successBorder: '#BBF7D0',
  successDark:   '#166534',
  // Warning
  warning:       '#D97706',
  warningLight:  '#FFFBEB',
  warningBorder: '#FDE68A',
  // Danger
  danger:        '#DC2626',
  dangerLight:   '#FEF2F2',
  dangerBorder:  '#FECACA',
  dangerDark:    '#991B1B',
  dangerDeep:    '#7F1D1D',
  // Status misc
  statusGrey:    '#6B7280',
  statusGreyBg:  '#F3F4F6',
  // Utility
  white:         '#FFFFFF',
  black:         '#000000',

  // ── Legacy aliases (backward compat) ─────────────────────────────────────
  background:        '#FFFFFF',
  textSecondary:     '#6B7280',
  textDisabled:      '#9CA3AF',
  secondary:         '#6B7280',
  secondaryLight:    '#F3F4F6',
  destructive:       '#DC2626',
  destructiveLight:  '#FEF2F2',
  borderFocus:       '#2563EB',
  info:              '#0891B2',
  infoLight:         '#ECFEFF',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

/** Font sizes — matches tokens.js `font.sizes` exactly. */
export const fontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  base: 17,   // ← body / interactive element size
  lg:   20,
  xl:   24,
  xxl:  30,
} as const;

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

/** Numeric keys match tokens.js `space` object (space[4] = 16). */
export const spacing = {
  1: 4,  2: 8,  3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 12: 48,
  // Named aliases
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 48,
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

/**
 * Matches tokens.js `radius` object.
 * md (12) is the primary interactive-element radius used on buttons, inputs, cards.
 */
export const borderRadius = {
  xs:   4,
  sm:   8,
  md:   12,   // ← was 8 in old theme — corrected to match spec
  lg:   16,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

/**
 * RN shadow props equivalent of the CSS box-shadows in tokens.js.
 * Spread directly onto StyleSheet objects:
 *   `...shadow.card`
 */
export const shadow = {
  card: {
    shadowColor:  '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  3,
    elevation: 2,
  },
  fab: {
    shadowColor:  '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation: 8,
  },
  sheet: {
    shadowColor:  '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius:  24,
    elevation: 16,
  },
} as const;

// ─── Legacy `typography` export (kept for backward compat) ───────────────────

export const typography = {
  fontSizeXs:        11,
  fontSizeSm:        13,
  fontSizeBase:      15,
  fontSizeLg:        17,   // ← spec's "base" body size
  fontSizeXl:        20,
  fontSize2xl:       24,
  fontSize3xl:       30,
  lineHeightSm:      18,
  lineHeightBase:    22,
  lineHeightLg:      26,
  lineHeightXl:      30,
  fontWeightNormal:  '400' as const,
  fontWeightMedium:  '500' as const,
  fontWeightSemiBold:'600' as const,
  fontWeightBold:    '700' as const,
} as const;
