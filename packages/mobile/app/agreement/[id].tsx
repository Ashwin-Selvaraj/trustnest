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
import {
  NavHeader, Card, InfoRow, Banner, Button, StatusChip, ReputationBadge, SectionHeader,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { AgreementStatus, UserRole } from '@trustnest/shared';
import { agreementsApi } from '@/api/agreements';
import { useAuth } from '@/store/auth.store';
import type { Agreement } from '@/types/api';

export default function AgreementDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAuth();
  const userId    = state.user?.id;
  const viewerRole = state.user?.role ?? UserRole.TENANT;

  const [agreement, setAgreement] = React.useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError]         = React.useState<string | null>(null);

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

  React.useEffect(() => { void load(); }, [load]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !agreement) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Agreement not found'}</Text>
        <Button variant="secondary" onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const isUserTenant   = agreement.tenantId === userId;
  const isUserOwner    = agreement.ownerId  === userId;
  const hasUserConfirmed = isUserTenant ? !!agreement.tenantConfirmedAt : !!agreement.ownerConfirmedAt;

  const formatDate = (d: string): string =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatINR  = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

  const renderActions = (): React.ReactElement | null => {
    const { status } = agreement;
    if (status === AgreementStatus.DRAFT && !hasUserConfirmed) {
      return (
        <Button variant="primary" fullWidth onPress={() => router.push(`/agreement/${id}/confirm`)}>
          Confirm Agreement
        </Button>
      );
    }
    if (status === AgreementStatus.PENDING_DEPOSIT && isUserTenant) {
      return (
        <Button variant="primary" fullWidth onPress={() => router.push(`/agreement/${id}/payment`)}>
          Pay Security Deposit
        </Button>
      );
    }
    if (status === AgreementStatus.ACTIVE) {
      return (
        <View style={styles.actionsColumn}>
          {isUserOwner && (
            <Button
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
            >
              Release Deposit
            </Button>
          )}
          <Button variant="destructive" fullWidth onPress={() => router.push(`/agreement/${id}/dispute`)}>
            Raise Dispute
          </Button>
        </View>
      );
    }
    if (status === AgreementStatus.CLOSED && !hasUserConfirmed) {
      return (
        <Button variant="secondary" fullWidth onPress={() => router.push(`/agreement/${id}/confirm`)}>
          Rate Experience
        </Button>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Agreement"
        onBack={() => router.back()}
        right={<StatusChip status={agreement.status} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Property */}
        <Card style={styles.card}>
          <SectionHeader>Property</SectionHeader>
          <Text style={styles.propertyAddress}>{agreement.propertyAddress}</Text>
          {agreement.nftTokenIdTenant ? (
            <Text style={styles.nftLabel}>NFT #{agreement.nftTokenIdTenant}</Text>
          ) : null}
        </Card>

        {/* Parties */}
        <Card style={styles.card}>
          <SectionHeader>Parties</SectionHeader>
          <InfoRow label="Tenant" value={agreement.tenantName} highlight={isUserTenant} />
          <InfoRow label="Owner"  value={agreement.ownerName}  highlight={isUserOwner} />
        </Card>

        {/* Financials */}
        <Card style={styles.card}>
          <SectionHeader>Financials</SectionHeader>
          <InfoRow label="Monthly Rent"     value={formatINR(agreement.rentINR)}    highlight />
          <InfoRow label="Security Deposit" value={formatINR(agreement.depositINR)} />
        </Card>

        {/* Dates */}
        <Card style={styles.card}>
          <SectionHeader>Lease Period</SectionHeader>
          <InfoRow label="Start" value={formatDate(agreement.startDate)} />
          <InfoRow label="End"   value={formatDate(agreement.endDate)} />
        </Card>

        {/* Confirmations */}
        <Card style={styles.card}>
          <SectionHeader>Confirmations</SectionHeader>
          <InfoRow
            label="Tenant"
            value={agreement.tenantConfirmedAt ? `✅ ${formatDate(agreement.tenantConfirmedAt)}` : '⏳ Pending'}
          />
          <InfoRow
            label="Owner"
            value={agreement.ownerConfirmedAt ? `✅ ${formatDate(agreement.ownerConfirmedAt)}` : '⏳ Pending'}
          />
        </Card>

        {/* Reputation (closed agreements) */}
        {agreement.status === AgreementStatus.CLOSED && (
          <Card style={styles.card}>
            <SectionHeader>Reputation</SectionHeader>
            <ReputationBadge hasReviews={false} />
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>{renderActions()}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.surface },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  errorText:   { color: colors.danger, fontSize: fontSize.base, textAlign: 'center', marginBottom: spacing.base },
  content:     { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.base },
  card:        { gap: spacing.sm },
  propertyAddress: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
    lineHeight: 22,
  },
  nftLabel:    { fontSize: fontSize.xs, color: colors.textSec, fontStyle: 'italic' },
  actionsColumn: { gap: spacing.sm },
  actions:     { gap: spacing.sm },
});
