import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, StatusChip, ReputationBadge } from '@trustnest/ui-kit';
import { AgreementStatus, UserRole } from '@trustnest/shared';
import { agreementsApi } from '@/api/agreements';
import { useAuth } from '@/store/auth.store';
import type { Agreement } from '@/types/api';

/**
 * Agreement detail screen — shows full agreement info and context-aware action buttons.
 */
export default function AgreementDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const userId = state.user?.id;
  const viewerRole = state.user?.role ?? UserRole.TENANT;

  const [agreement, setAgreement] = React.useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (): Promise<void> => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await agreementsApi.get(id);
      setAgreement(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load agreement');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  if (error || !agreement) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Agreement not found'}</Text>
        <Button label="Go Back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const isUserTenant = agreement.tenantId === userId;
  const isUserOwner = agreement.ownerId === userId;
  const hasUserConfirmed = isUserTenant
    ? !!agreement.tenantConfirmedAt
    : !!agreement.ownerConfirmedAt;

  const formatDate = (d: string): string =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatINR = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

  // Action buttons based on status + role
  const renderActions = (): React.ReactElement | null => {
    const { status } = agreement;

    if (status === AgreementStatus.DRAFT && !hasUserConfirmed) {
      return (
        <Button
          label="Confirm Agreement"
          variant="primary"
          fullWidth
          onPress={() => router.push(`/agreement/${id}/confirm`)}
        />
      );
    }

    if (status === AgreementStatus.PENDING_DEPOSIT && isUserTenant) {
      return (
        <Button
          label="Pay Security Deposit"
          variant="primary"
          fullWidth
          onPress={() => router.push(`/agreement/${id}/payment`)}
        />
      );
    }

    if (status === AgreementStatus.ACTIVE) {
      return (
        <View style={styles.actionsColumn}>
          {isUserOwner && (
            <Button
              label="Release Deposit"
              variant="primary"
              fullWidth
              onPress={() => {
                Alert.alert(
                  'Release Deposit',
                  'This will transfer the full deposit back to the tenant. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Release',
                      onPress: () => {
                        void agreementsApi
                          .release(id)
                          .then(() => void load())
                          .catch((e: Error) => Alert.alert('Error', e.message));
                      },
                    },
                  ],
                );
              }}
            />
          )}
          <Button
            label="Raise Dispute"
            variant="destructive"
            fullWidth
            onPress={() => router.push(`/agreement/${id}/dispute`)}
          />
        </View>
      );
    }

    if (status === AgreementStatus.CLOSED && !hasUserConfirmed) {
      // Re-use "hasUserConfirmed" to check if already rated
      return (
        <Button
          label="Rate Experience"
          variant="secondary"
          fullWidth
          onPress={() => router.push(`/agreement/${id}/confirm`)}
        />
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={styles.statusRow}>
        <StatusChip status={agreement.status} />
        {agreement.nftTokenIdTenant ? (
          <Text style={styles.nftLabel}>NFT #{agreement.nftTokenIdTenant}</Text>
        ) : null}
      </View>

      {/* Property */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property</Text>
        <Text style={styles.propertyAddress}>{agreement.propertyAddress}</Text>
      </View>

      {/* Parties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parties</Text>
        <InfoRow label="Tenant" value={agreement.tenantName} highlight={isUserTenant} />
        <InfoRow label="Owner" value={agreement.ownerName} highlight={isUserOwner} />
      </View>

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financials</Text>
        <InfoRow label="Monthly Rent" value={formatINR(agreement.rentINR)} />
        <InfoRow label="Security Deposit" value={formatINR(agreement.depositINR)} />
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lease Period</Text>
        <InfoRow label="Start" value={formatDate(agreement.startDate)} />
        <InfoRow label="End" value={formatDate(agreement.endDate)} />
      </View>

      {/* Confirmations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirmations</Text>
        <InfoRow
          label="Tenant"
          value={agreement.tenantConfirmedAt ? `✅ ${formatDate(agreement.tenantConfirmedAt)}` : '⏳ Pending'}
        />
        <InfoRow
          label="Owner"
          value={agreement.ownerConfirmedAt ? `✅ ${formatDate(agreement.ownerConfirmedAt)}` : '⏳ Pending'}
        />
      </View>

      {/* Reputation preview */}
      {agreement.status === AgreementStatus.CLOSED && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reputation</Text>
          <ReputationBadge averageScore={null} tokenCount={0} compact />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>{renderActions()}</View>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#DC2626', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nftLabel: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  infoValueHighlight: { color: '#2563EB', fontWeight: '600' },
  actionsColumn: { gap: 10 },
  actions: { gap: 10 },
});
