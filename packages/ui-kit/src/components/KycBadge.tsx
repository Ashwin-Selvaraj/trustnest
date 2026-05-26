/**
 * KycBadge — pill showing KYC verification state.
 * Matches design-reference/primitives.jsx KycBadge exactly.
 *
 * @example
 * ```tsx
 * <KycBadge state="pending"  />
 * <KycBadge state="verified" />
 * <KycBadge state="rejected" />
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
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type KycState = 'pending' | 'verified' | 'rejected';

export interface KycBadgeProps {
  state?: KycState;
  style?: StyleProp<ViewStyle>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={5.5} stroke={color} strokeWidth={1.6} />
      <Path d="M7 4V7L9 8.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={6} fill={color} fillOpacity={0.15} />
      <Path
        d="M4 7L6.2 9.2L10 5.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={6} fill={color} fillOpacity={0.15} />
      <Path
        d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

interface KycConfig {
  label: string;
  fg:    string;
  bg:    string;
  Icon:  React.ComponentType<{ color: string }>;
}

const CONFIG: Record<KycState, KycConfig> = {
  pending:  { label: 'KYC Pending',  fg: colors.warning,     bg: colors.warningLight,  Icon: ClockIcon },
  verified: { label: 'KYC Verified', fg: colors.success,     bg: colors.successLight,  Icon: CheckIcon },
  rejected: { label: 'KYC Rejected', fg: colors.danger,      bg: colors.dangerLight,   Icon: XIcon     },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function KycBadge({
  state = 'pending',
  style,
}: KycBadgeProps): React.ReactElement {
  const { label, fg, bg, Icon } = CONFIG[state];

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg },
        style,
      ]}
    >
      <Icon color={fg} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    gap:               6,
    paddingVertical:   5,
    paddingHorizontal: 10,
    borderRadius:      borderRadius.full,
  },
  label: {
    fontSize:   fontSize.sm,          // 13
    fontWeight: fontWeight.semibold,
  },
});
