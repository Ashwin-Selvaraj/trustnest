/**
 * StatusChip — pill badge for agreement / property / interest status values.
 *
 * Props API mirrors design-reference/primitives.jsx StatusChip exactly.
 *
 * @example
 * ```tsx
 * <StatusChip status={AgreementStatus.ACTIVE} />
 * <StatusChip status={AgreementStatus.DISPUTED} size="sm" />
 * ```
 */

import * as React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AgreementStatus } from '@trustnest/shared';
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatusChipProps {
  status: AgreementStatus;
  /** `'md'` (default) or `'sm'` for compact use inside cards. */
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// ─── Status config (matches spec STATUS_STYLES exactly) ──────────────────────

const CONFIG: Record<AgreementStatus, { label: string; bg: string; fg: string }> = {
  [AgreementStatus.DRAFT]: {
    label: 'Draft',
    bg:    '#F3F4F6',
    fg:    '#374151',
  },
  [AgreementStatus.PENDING_DEPOSIT]: {
    label: 'Pending deposit',   // lowercase 'd' — matches spec
    bg:    colors.warningLight,
    fg:    colors.warning,
  },
  [AgreementStatus.ACTIVE]: {
    label: 'Active',
    bg:    colors.successLight,
    fg:    colors.success,
  },
  [AgreementStatus.RELEASING]: {
    label: 'Releasing',
    bg:    colors.primaryLight,
    fg:    colors.primary,
  },
  [AgreementStatus.DISPUTED]: {
    label: 'Disputed',
    bg:    colors.dangerLight,
    fg:    colors.danger,
  },
  [AgreementStatus.CLOSED]: {
    label: 'Closed',
    bg:    '#F3F4F6',
    fg:    '#374151',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusChip({
  status,
  size  = 'md',
  style,
}: StatusChipProps): React.ReactElement {
  const config = CONFIG[status] ?? CONFIG[AgreementStatus.DRAFT];
  const small  = size === 'sm';

  return (
    <View
      style={[
        styles.chip,
        small ? styles.chipSm : styles.chipMd,
        { backgroundColor: config.bg },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.fg }]} />
      <Text
        style={[
          styles.label,
          small ? styles.labelSm : styles.labelMd,
          { color: config.fg },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chip: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    borderRadius:   borderRadius.full,
    gap: 5,
  },
  chipMd: {
    paddingVertical:   4,
    paddingHorizontal: 10,
  },
  chipSm: {
    paddingVertical:   2,
    paddingHorizontal: 8,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    flexShrink:   0,
  },
  label: {
    fontWeight:     fontWeight.semibold,
    letterSpacing:  0.1,
  },
  labelMd: {
    fontSize:   fontSize.sm,    // 13
    lineHeight: 18,
  },
  labelSm: {
    fontSize:   fontSize.xs,    // 11
    lineHeight: 16,
  },
});
