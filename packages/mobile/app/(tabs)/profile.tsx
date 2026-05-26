import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Card, Banner, Button,
  KycBadge, ReputationBadge, InfoRow,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { KycStatus, KycMethod, PaymentDetailsStatus, UserRole } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';
import { usersApi } from '@/api/users';
import type { ReputationScore, PaymentDetailsResponse } from '@/types/api';

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
      { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const kycStatus  = user?.kycStatus ?? KycStatus.PENDING;
  const kycState   = kycStatus === KycStatus.VERIFIED
    ? 'verified'
    : kycStatus === KycStatus.REJECTED
    ? 'rejected'
    : 'pending';

  const roleLabel = (): string => {
    switch (user?.role) {
      case UserRole.OWNER: return '🏠 Property Owner';
      case UserRole.BOTH:  return '🔄 Tenant & Owner';
      default:             return '🧳 Tenant';
    }
  };

  const maskedIdentifier = (): string | null => {
    if (!user) return null;
    if (user.kycMethod === KycMethod.AADHAAR) return user.maskedAadhaar ?? null;
    if (user.kycMethod === KycMethod.PAN)     return user.maskedPan ?? null;
    return null;
  };

  const paymentStatusLabel = (): string => {
    const status = paymentDetails?.status ?? PaymentDetailsStatus.NONE;
    switch (status) {
      case PaymentDetailsStatus.VERIFIED:             return 'Verified';
      case PaymentDetailsStatus.PENDING_VERIFICATION: return 'Pending';
      default:                                         return 'Not added';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + identity header */}
      <View style={styles.avatarSection}>
        <Avatar name={user?.fullName ?? '?'} size={72} />
        <Text style={styles.name}>{user?.fullName ?? 'Your Name'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <Text style={styles.role}>{roleLabel()}</Text>
      </View>

      {/* Warning banners for incomplete tiers */}
      {!user?.profileComplete && (
        <Pressable onPress={() => router.push('/(auth)/complete-profile')}>
          <Banner variant="warning">
            <Text style={styles.bannerLink}>
              👤 Complete your profile — add name, role, and date of birth →
            </Text>
          </Banner>
        </Pressable>
      )}

      {kycStatus !== KycStatus.VERIFIED && (
        <Pressable onPress={() => router.push('/(auth)/kyc')}>
          <Banner variant="warning">
            <Text style={styles.bannerLink}>
              🔒 Complete KYC to create agreements →
            </Text>
          </Banner>
        </Pressable>
      )}

      {(paymentDetails?.status ?? PaymentDetailsStatus.NONE) !== PaymentDetailsStatus.VERIFIED && (
        <Pressable onPress={() => router.push('/(auth)/payment-details')}>
          <Banner variant="warning">
            <Text style={styles.bannerLink}>
              💳 Add payment details to enable deposits →
            </Text>
          </Banner>
        </Pressable>
      )}

      {/* Verification card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Identity Verification</Text>
        <InfoRow
          label={user?.kycMethod === KycMethod.AADHAAR ? 'Aadhaar' : user?.kycMethod === KycMethod.PAN ? 'PAN' : 'Method'}
          value={maskedIdentifier() ?? '—'}
        />
        <View style={styles.badgeRow}>
          <KycBadge state={kycState} />
          {user?.kycRejectionReason ? (
            <Text style={styles.rejectionReason} numberOfLines={2}>
              {user.kycRejectionReason}
            </Text>
          ) : null}
        </View>
        {kycStatus !== KycStatus.VERIFIED && (
          <Pressable onPress={() => router.push('/(auth)/kyc')}>
            <Text style={styles.actionLink}>Verify Identity →</Text>
          </Pressable>
        )}
      </Card>

      {/* Payment Details card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Payment Details</Text>
        <InfoRow label="Status" value={paymentStatusLabel()} />
        {paymentDetails?.upiId && (
          <InfoRow label="UPI" value={paymentDetails.upiId} />
        )}
        {paymentDetails?.maskedBankAccount && (
          <InfoRow label="Bank" value={paymentDetails.maskedBankAccount} />
        )}
        <Pressable onPress={() => router.push('/(auth)/payment-details')}>
          <Text style={styles.actionLink}>
            {paymentDetails?.hasDetails ? 'Edit' : 'Add Payment Details'} →
          </Text>
        </Pressable>
      </Card>

      {/* Reputation card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Reputation Score</Text>
        {reputationLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ReputationBadge
            score={reputation?.averageScore ?? 0}
            reviews={reputation?.totalReviews ?? 0}
            hasReviews={!!reputation && (reputation.totalReviews ?? 0) > 0}
          />
        )}
      </Card>

      {/* Sign Out */}
      <Button
        variant="secondary"
        fullWidth
        onPress={handleSignOut}
        style={styles.signOut}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content:   { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.base },
  avatarSection: {
    alignItems:      'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             spacing.xs,
  },
  name: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
    color:      colors.text,
  },
  phone:       { fontSize: fontSize.sm, color: colors.textSec },
  role:        { fontSize: fontSize.sm, color: colors.textSec, fontWeight: fontWeight.medium },
  bannerLink:  { color: colors.warning, fontWeight: fontWeight.medium },
  card:        { gap: spacing.sm },
  cardTitle: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  rejectionReason: { fontSize: fontSize.xs, color: colors.danger, flex: 1 },
  actionLink: {
    fontSize:   fontSize.sm,
    color:      colors.primary,
    fontWeight: fontWeight.semibold,
    paddingTop: spacing.xs,
  },
  signOut: { marginTop: spacing.sm },
});
