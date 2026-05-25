import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AgreementStatus, UserRole } from '@trustnest/shared';
import { colors, spacing, borderRadius, typography } from '../theme';
import { StatusChip } from './StatusChip';

export interface AgreementCardProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Unique identifier (UUID). Used for key prop in lists. */
  id: string;
  /** Civic address of the property. */
  propertyAddress: string;
  /** Current agreement lifecycle status. */
  status: AgreementStatus;
  /** Monthly rent in INR (integer). */
  rentINR: number;
  /** Security deposit amount in INR (integer). */
  depositINR: number;
  /** Display name of the tenant. */
  tenantName: string;
  /** Display name of the owner. */
  ownerName: string;
  /** Lease start date (ISO string or Date). */
  startDate: string | Date;
  /** Lease end date (ISO string or Date). */
  endDate: string | Date;
  /**
   * Which party the current user is — controls the "other party" label.
   * Defaults to `UserRole.TENANT`.
   */
  viewerRole?: UserRole;
  /** Override card container style. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Summary card for an agreement, suitable for a list view.
 *
 * @example
 * ```tsx
 * <AgreementCard
 *   id={agreement.id}
 *   propertyAddress="12 MG Road, Bengaluru"
 *   status={AgreementStatus.ACTIVE}
 *   rentINR={25000}
 *   depositINR={75000}
 *   tenantName="Ashwin S"
 *   ownerName="Ravi K"
 *   startDate="2025-01-01"
 *   endDate="2025-12-31"
 *   viewerRole={UserRole.TENANT}
 *   onPress={() => router.push(`/agreement/${agreement.id}`)}
 * />
 * ```
 */
export function AgreementCard({
  propertyAddress,
  status,
  rentINR,
  depositINR,
  tenantName,
  ownerName,
  startDate,
  endDate,
  viewerRole = UserRole.TENANT,
  style,
  ...rest
}: AgreementCardProps): React.ReactElement {
  const otherPartyLabel = viewerRole === UserRole.TENANT ? 'Owner' : 'Tenant';
  const otherPartyName = viewerRole === UserRole.TENANT ? ownerName : tenantName;

  const formatDate = (d: string | Date): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatINRAmount = (amount: number): string =>
    `₹${amount.toLocaleString('en-IN')}`;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.8}
      {...rest}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
          {propertyAddress}
        </Text>
        <StatusChip status={status} />
      </View>

      {/* Party */}
      <View style={styles.partyRow}>
        <Text style={styles.metaLabel}>{otherPartyLabel}</Text>
        <Text style={styles.metaValue}>{otherPartyName}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Amounts */}
      <View style={styles.amountsRow}>
        <View style={styles.amountCell}>
          <Text style={styles.metaLabel}>Monthly Rent</Text>
          <Text style={styles.amountValue}>{formatINRAmount(rentINR)}</Text>
        </View>
        <View style={styles.amountCell}>
          <Text style={styles.metaLabel}>Deposit</Text>
          <Text style={styles.amountValue}>{formatINRAmount(depositINR)}</Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.datesRow}>
        <Text style={styles.dateText}>
          {formatDate(startDate)} – {formatDate(endDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  address: {
    flex: 1,
    fontSize: typography.fontSizeBase,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.text,
    lineHeight: typography.lineHeightBase,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaLabel: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightNormal,
  },
  metaValue: {
    fontSize: typography.fontSizeSm,
    color: colors.text,
    fontWeight: typography.fontWeightMedium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  amountsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  amountCell: {
    gap: 2,
  },
  amountValue: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.text,
  },
  datesRow: {
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSizeXs + 1,
    color: colors.textSecondary,
  },
});
