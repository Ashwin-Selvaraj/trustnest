/**
 * TenantSummaryCard — shows tenant info with accept/decline actions.
 */

import * as React from 'react';
import {
  View, Text, StyleSheet,
} from 'react-native';
import { KycStatus } from '@trustnest/shared';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { KycBadge } from './KycBadge';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantSummaryCardProps {
  tenantName: string;
  kycStatus: KycStatus;
  score: number | null;
  reviewCount: number;
  message?: string;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TenantSummaryCard({
  tenantName,
  kycStatus,
  score,
  reviewCount,
  message,
  onAccept,
  onDecline,
  isLoading = false,
}: TenantSummaryCardProps): React.ReactElement {
  const initial = tenantName[0]?.toUpperCase() ?? '?';

  const kycState: 'pending' | 'verified' | 'rejected' =
    kycStatus === KycStatus.VERIFIED ? 'verified'
    : kycStatus === KycStatus.REJECTED ? 'rejected'
    : 'pending';

  return (
    <View style={styles.card}>
      {/* Left section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{tenantName}</Text>
          <KycBadge state={kycState} />
        </View>
      </View>

      {/* Stars */}
      {score !== null && (
        <Text style={styles.score}>
          ★ {score.toFixed(1)}
          <Text style={styles.reviewCount}>  {reviewCount} review{reviewCount !== 1 ? 's' : ''}</Text>
        </Text>
      )}

      {/* Message */}
      {message ? (
        <View style={styles.messageBlock}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          onPress={onAccept}
          disabled={isLoading}
          loading={isLoading}
          style={styles.actionBtn}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onPress={onDecline}
          disabled={isLoading}
          style={styles.actionBtn}
        >
          Decline
        </Button>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    borderRadius.md,
    padding:         spacing.base,
    gap:             spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
  },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  avatarText: {
    fontSize:   fontSize.md,
    fontWeight: fontWeight.bold,
    color:      '#FFFFFF',
  },
  nameBlock: {
    flex: 1,
    gap:  4,
  },
  name: {
    fontSize:   fontSize.md,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
  },
  score: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.warning,
  },
  reviewCount: {
    color:      colors.textSec,
    fontWeight: fontWeight.regular,
  },
  messageBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius:    borderRadius.sm,
    padding:         spacing.sm,
  },
  messageText: {
    fontSize: fontSize.sm,
    color:    colors.textSec,
  },
  actions: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginTop:     spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
