import * as React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { AgreementStatus } from '@trustnest/shared';
import { colors, borderRadius, spacing, typography } from '../theme';

export interface StatusChipProps {
  status: AgreementStatus;
  /** Override wrapper style. */
  style?: StyleProp<ViewStyle>;
}

const STATUS_CONFIG: Record<
  AgreementStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  [AgreementStatus.DRAFT]: {
    label: 'Draft',
    bg: colors.secondaryLight,
    text: colors.secondary,
    dot: colors.secondary,
  },
  [AgreementStatus.PENDING_DEPOSIT]: {
    label: 'Pending Deposit',
    bg: colors.warningLight,
    text: colors.warning,
    dot: colors.warning,
  },
  [AgreementStatus.ACTIVE]: {
    label: 'Active',
    bg: colors.successLight,
    text: colors.success,
    dot: colors.success,
  },
  [AgreementStatus.RELEASING]: {
    label: 'Releasing',
    bg: colors.primaryLight,
    text: colors.primary,
    dot: colors.primary,
  },
  [AgreementStatus.DISPUTED]: {
    label: 'Disputed',
    bg: colors.destructiveLight,
    text: colors.destructive,
    dot: colors.destructive,
  },
  [AgreementStatus.CLOSED]: {
    label: 'Closed',
    bg: colors.secondaryLight,
    text: colors.secondary,
    dot: colors.secondary,
  },
};

/**
 * Pill-shaped status badge reflecting an AgreementStatus value.
 * Each status maps to a distinct background / foreground colour pair.
 *
 * @example
 * ```tsx
 * <StatusChip status={AgreementStatus.ACTIVE} />
 * ```
 */
export function StatusChip({ status, style }: StatusChipProps): React.ReactElement {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.chip, { backgroundColor: config.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: typography.fontSizeXs + 1,
    fontWeight: typography.fontWeightMedium,
    lineHeight: typography.lineHeightSm,
  },
});
