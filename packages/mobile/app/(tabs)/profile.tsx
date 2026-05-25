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
import { ReputationBadge, Button, StatusChip } from '@trustnest/ui-kit';
import { AgreementStatus, KycStatus, UserRole } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';
import { usersApi } from '@/api/users';
import type { ReputationScore } from '@/types/api';

/**
 * Profile screen — shows KYC status, reputation score, and past agreements summary.
 */
export default function ProfileScreen(): React.ReactElement {
  const { state, signOut } = useAuth();
  const { user } = state;

  const [reputation, setReputation] = React.useState<ReputationScore | null>(null);
  const [reputationLoading, setReputationLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    setReputationLoading(true);
    usersApi
      .getReputation(user.id)
      .then((r) => setReputation(r))
      .catch(() => setReputation(null))
      .finally(() => setReputationLoading(false));
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
        <Text style={styles.role}>
          {user?.role === UserRole.OWNER ? '🏠 Property Owner' : '🧳 Tenant'}
        </Text>
      </View>

      {/* KYC Status */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Identity Verification</Text>
          <View style={styles.kycBadge}>
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
            averageScore={reputation ? reputation.averageScore : null}
            tokenCount={reputation?.totalReviews ?? 0}
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
        label="Sign Out"
        variant="secondary"
        fullWidth
        onPress={handleSignOut}
        style={styles.signOut}
      />
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
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kycLabel: {
    fontSize: 13,
    fontWeight: '600',
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
