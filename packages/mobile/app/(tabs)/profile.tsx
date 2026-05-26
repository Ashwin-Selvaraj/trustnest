import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ReputationBadge, Button, StatusChip } from '@trustnest/ui-kit';
import { AgreementStatus, KycStatus, KycMethod, PaymentDetailsStatus, UserRole } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';
import { usersApi } from '@/api/users';
import type { ReputationScore, PaymentDetailsResponse } from '@/types/api';

/**
 * Profile screen — shows KYC status, reputation score, payment details, and past agreements.
 */
export default function ProfileScreen(): React.ReactElement {
  const { state, signOut } = useAuth();
  const { user } = state;

  const [reputation, setReputation] = React.useState<ReputationScore | null>(null);
  const [reputationLoading, setReputationLoading] = React.useState(true);
  const [paymentDetails, setPaymentDetails] = React.useState<PaymentDetailsResponse | null>(null);

  React.useEffect(() => {
    if (!user) return;
    setReputationLoading(true);
    usersApi
      .getReputation(user.id)
      .then((r) => setReputation(r))
      .catch(() => setReputation(null))
      .finally(() => setReputationLoading(false));

    usersApi
      .getPaymentDetails()
      .then((d) => setPaymentDetails(d))
      .catch(() => setPaymentDetails(null));
  }, [user]);

  const handleSignOut = (): void => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  const kycConfig: Record<KycStatus, { label: string; color: string; emoji: string }> = {
    [KycStatus.PENDING]: { label: 'KYC Pending', color: '#D97706', emoji: '⏳' },
    [KycStatus.VERIFIED]: { label: 'KYC Verified', color: '#16A34A', emoji: '✅' },
    [KycStatus.REJECTED]: { label: 'KYC Rejected', color: '#DC2626', emoji: '❌' },
  };

  const kycStatus = user?.kycStatus ?? KycStatus.PENDING;
  const kyc = kycConfig[kycStatus];

  const roleLabel = (): string => {
    switch (user?.role) {
      case UserRole.OWNER: return '🏠 Property Owner';
      case UserRole.BOTH:  return '🔄 Tenant & Owner';
      default:             return '🧳 Tenant';
    }
  };

  const kycMethodLabel = (): string | null => {
    if (!user?.kycMethod) return null;
    return user.kycMethod === KycMethod.AADHAAR ? '🪪 Aadhaar' : '📄 PAN';
  };

  const maskedIdentifier = (): string | null => {
    if (!user) return null;
    if (user.kycMethod === KycMethod.AADHAAR) return user.maskedAadhaar ?? null;
    if (user.kycMethod === KycMethod.PAN) return user.maskedPan ?? null;
    return null;
  };

  const paymentStatusLabel = (): { label: string; color: string } => {
    const status = paymentDetails?.status ?? PaymentDetailsStatus.NONE;
    switch (status) {
      case PaymentDetailsStatus.VERIFIED:
        return { label: 'Verified', color: '#16A34A' };
      case PaymentDetailsStatus.PENDING_VERIFICATION:
        return { label: 'Pending', color: '#D97706' };
      default:
        return { label: 'Not added', color: '#6B7280' };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? 'Your Name'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <Text style={styles.role}>{roleLabel()}</Text>
      </View>

      {/* Warning banners for incomplete tiers */}
      {!user?.profileComplete ? (
        <TouchableOpacity
          style={styles.warningCard}
          onPress={() => router.push('/(auth)/complete-profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.warningIcon}>👤</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Complete Your Profile</Text>
            <Text style={styles.warningDesc}>Add your name, role, and date of birth</Text>
          </View>
          <Text style={styles.warningArrow}>›</Text>
        </TouchableOpacity>
      ) : null}

      {kycStatus !== KycStatus.VERIFIED ? (
        <TouchableOpacity
          style={styles.warningCard}
          onPress={() => router.push('/(auth)/kyc')}
          activeOpacity={0.7}
        >
          <Text style={styles.warningIcon}>🔒</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Complete Identity Verification</Text>
            <Text style={styles.warningDesc}>Required to create or confirm agreements</Text>
          </View>
          <Text style={styles.warningArrow}>›</Text>
        </TouchableOpacity>
      ) : null}

      {(paymentDetails?.status ?? PaymentDetailsStatus.NONE) !== PaymentDetailsStatus.VERIFIED ? (
        <TouchableOpacity
          style={styles.warningCard}
          onPress={() => router.push('/(auth)/payment-details')}
          activeOpacity={0.7}
        >
          <Text style={styles.warningIcon}>💳</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Add Payment Details</Text>
            <Text style={styles.warningDesc}>Required to pay or receive deposits</Text>
          </View>
          <Text style={styles.warningArrow}>›</Text>
        </TouchableOpacity>
      ) : null}

      {/* Verification card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Identity Verification</Text>
          <View style={styles.badgeRow}>
            <Text style={{ fontSize: 14 }}>{kyc.emoji}</Text>
            <Text style={[styles.kycLabel, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
        </View>

        {user?.kycMethod ? (
          <View style={styles.kycDetailRow}>
            <Text style={styles.kycMethodBadge}>{kycMethodLabel()}</Text>
            {maskedIdentifier() ? (
              <Text style={styles.maskedId}>{maskedIdentifier()}</Text>
            ) : null}
          </View>
        ) : null}

        {kycStatus === KycStatus.PENDING && !user?.kycMethod ? (
          <Text style={styles.cardHint}>
            Complete KYC to create or confirm rental agreements.
          </Text>
        ) : null}

        {kycStatus === KycStatus.REJECTED && user?.kycRejectionReason ? (
          <View style={styles.rejectionRow}>
            <Text style={styles.rejectionLabel}>Reason:</Text>
            <Text style={styles.rejectionReason}>{user.kycRejectionReason}</Text>
          </View>
        ) : null}

        {kycStatus !== KycStatus.VERIFIED ? (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/kyc')}
            style={styles.cardAction}
          >
            <Text style={styles.cardActionText}>Verify Identity →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Payment Details card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Payment Details</Text>
          <Text style={[styles.paymentStatus, { color: paymentStatusLabel().color }]}>
            {paymentStatusLabel().label}
          </Text>
        </View>

        {paymentDetails?.hasDetails ? (
          <>
            {paymentDetails.upiId ? (
              <Text style={styles.paymentDetail}>UPI: {paymentDetails.upiId}</Text>
            ) : null}
            {paymentDetails.maskedBankAccount ? (
              <Text style={styles.paymentDetail}>Bank: {paymentDetails.maskedBankAccount}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.cardHint}>No payment details added yet.</Text>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(auth)/payment-details')}
          style={styles.cardAction}
        >
          <Text style={styles.cardActionText}>
            {paymentDetails?.hasDetails ? 'Edit' : 'Add Payment Details'} →
          </Text>
        </TouchableOpacity>
      </View>

      {/* KYC Status */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Verification Status</Text>
          <View style={styles.badgeRow}>
            <Text style={{ fontSize: 14 }}>{kyc.emoji}</Text>
            <Text style={[styles.kycLabel, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
        </View>
        {kycStatus === KycStatus.PENDING && (
          <Text style={styles.cardHint}>
            Complete KYC to start creating agreements.
          </Text>
        )}
      </View>

      {/* Reputation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reputation Score</Text>
        {reputationLoading ? (
          <ActivityIndicator color="#2563EB" />
        ) : (
          <ReputationBadge
            score={reputation?.averageScore ?? 0}
            reviews={reputation?.totalReviews ?? 0}
            hasReviews={!!reputation && (reputation.totalReviews ?? 0) > 0}
          />
        )}
      </View>

      {/* Agreement Status Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Agreement Overview</Text>
        <View style={styles.statusGrid}>
          {[
            AgreementStatus.ACTIVE,
            AgreementStatus.PENDING_DEPOSIT,
            AgreementStatus.CLOSED,
            AgreementStatus.DISPUTED,
          ].map((status) => (
            <View key={status} style={styles.statusGridItem}>
              <StatusChip status={status} />
            </View>
          ))}
        </View>
        <Text style={styles.cardHint}>Tap an agreement on the home screen for details.</Text>
      </View>

      {/* Sign Out */}
      <Button
        variant="secondary"
        fullWidth
        onPress={handleSignOut}
        style={styles.signOut}
      >Sign Out</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  phone: {
    fontSize: 14,
    color: '#6B7280',
  },
  role: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  warningIcon: {
    fontSize: 20,
  },
  warningContent: {
    flex: 1,
    gap: 2,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  warningDesc: {
    fontSize: 12,
    color: '#78350F',
  },
  warningArrow: {
    fontSize: 20,
    color: '#D97706',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cardHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  cardAction: {
    paddingTop: 4,
  },
  cardActionText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kycLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  kycDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kycMethodBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  maskedId: {
    fontSize: 13,
    color: '#6B7280',
    letterSpacing: 1,
  },
  rejectionRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  rejectionLabel: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  rejectionReason: {
    fontSize: 13,
    color: '#991B1B',
    flex: 1,
  },
  paymentStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentDetail: {
    fontSize: 13,
    color: '#374151',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusGridItem: {},
  signOut: {
    marginTop: 8,
  },
});
