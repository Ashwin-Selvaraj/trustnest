/**
 * Banner — info / warning / danger / success contextual message.
 * Matches design-reference/primitives.jsx Banner exactly.
 *
 * @example
 * ```tsx
 * <Banner variant="info" title="Identity required">
 *   Verify your identity to create a rental agreement.
 * </Banner>
 * <Banner variant="warning">Your KYC is still pending review.</Banner>
 * <Banner variant="danger" title="Disputed">
 *   This agreement has an active dispute.
 * </Banner>
 * ```
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BannerVariant = 'info' | 'warning' | 'danger' | 'success';

export interface BannerProps {
  variant?:  BannerVariant;
  /** Bold title line above the body. Optional. */
  title?:    string;
  children?: React.ReactNode;
  /** Override the default variant icon. */
  icon?:     React.ReactNode;
  style?:    StyleProp<ViewStyle>;
}

// ─── Per-variant config ───────────────────────────────────────────────────────

interface VariantConfig {
  bg:      string;
  border:  string;
  fg:      string;
  accent:  string;
  titleFg: string;
}

const VARIANT: Record<BannerVariant, VariantConfig> = {
  info: {
    bg:      colors.primaryLight,
    border:  colors.primaryBorder,
    fg:      colors.text,
    accent:  colors.primary,
    titleFg: colors.text,
  },
  warning: {
    bg:      colors.warningLight,
    border:  colors.warningBorder,
    fg:      '#78350F',
    accent:  colors.warning,
    titleFg: '#78350F',
  },
  danger: {
    bg:      colors.dangerLight,
    border:  colors.dangerBorder,
    fg:      colors.dangerDeep,
    accent:  colors.danger,
    titleFg: colors.dangerDark,
  },
  success: {
    bg:      colors.successLight,
    border:  colors.successBorder,
    fg:      colors.successDark,
    accent:  colors.success,
    titleFg: colors.successDark,
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} fill={color} fillOpacity={0.15} />
      <Circle cx={10} cy={10} r={9} stroke={color} strokeWidth={1.5} />
      <Path d="M10 9V14M10 6.5V6.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function WarnIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 2L19 17H1L10 2Z"
        fill={color} fillOpacity={0.15}
        stroke={color} strokeWidth={1.5} strokeLinejoin="round"
      />
      <Path d="M10 8V12M10 14.5V14.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />
      <Path d="M5.5 10L8.5 13L14.5 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const DEFAULT_ICON: Record<BannerVariant, (color: string) => React.ReactNode> = {
  info:    (c) => <InfoIcon  color={c} />,
  warning: (c) => <WarnIcon  color={c} />,
  danger:  (c) => <WarnIcon  color={c} />,
  success: (c) => <CheckIcon color={c} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Banner({
  variant  = 'info',
  title,
  children,
  icon,
  style,
}: BannerProps): React.ReactElement {
  const v = VARIANT[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <View style={styles.iconSlot}>
        {icon ?? DEFAULT_ICON[variant](v.accent)}
      </View>
      <View style={styles.body}>
        {title ? (
          <Text style={[styles.title, { color: v.titleFg }]}>{title}</Text>
        ) : null}
        {typeof children === 'string' ? (
          <Text style={[styles.text, { color: v.fg }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    gap:            spacing.md,       // 12
    alignItems:     'flex-start',
    borderWidth:    1,
    borderRadius:   borderRadius.md,  // 12
    padding:        14,
  },
  iconSlot: {
    flexShrink: 0,
    marginTop:  1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize:   fontSize.base,        // 17
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  text: {
    fontSize:   fontSize.sm,          // 13
    lineHeight: 20,
  },
});
