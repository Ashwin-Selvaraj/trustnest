/**
 * InterestStatusChip — pill badge for property interest status values.
 *
 * @example
 * ```tsx
 * <InterestStatusChip status={InterestStatus.PENDING} />
 * <InterestStatusChip status={InterestStatus.ACCEPTED} size="sm" />
 * ```
 */

import * as React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { InterestStatus } from '@trustnest/shared';
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InterestStatusChipProps {
  status: InterestStatus;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG: Record<InterestStatus, { label: string; bg: string; fg: string }> = {
  [InterestStatus.PENDING]:   { label: 'Pending',   bg: colors.warningLight, fg: colors.warning },
  [InterestStatus.ACCEPTED]:  { label: 'Accepted',  bg: colors.successLight, fg: colors.success },
  [InterestStatus.DECLINED]:  { label: 'Declined',  bg: colors.dangerLight,  fg: colors.danger  },
  [InterestStatus.WITHDRAWN]: { label: 'Withdrawn', bg: '#F3F4F6',           fg: '#374151'      },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InterestStatusChip({
  status,
  size  = 'md',
  style,
}: InterestStatusChipProps): React.ReactElement {
  const config = CONFIG[status] ?? CONFIG[InterestStatus.PENDING];
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
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontSize:   fontSize.sm,
    lineHeight: 18,
  },
  labelSm: {
    fontSize:   fontSize.xs,
    lineHeight: 16,
  },
});
