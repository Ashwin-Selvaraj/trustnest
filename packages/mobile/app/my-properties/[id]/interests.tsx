import * as React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  TenantSummaryCard, Banner, InterestStatusChip,
  colors, spacing, fontSize, fontWeight, borderRadius, shadow,
  InterestStatus,
} from '@trustnest/ui-kit';
import { KycStatus } from '@trustnest/shared';
import { propertiesApi } from '@/api/properties';
import type { PropertyInterest } from '@/types/api';

interface ExtendedInterest extends PropertyInterest {
  tenantKycStatus?: KycStatus;
  tenantScore?: number | null;
  tenantReviewCount?: number;
}

export default function PropertyInterestsScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [interests, setInterests] = React.useState<ExtendedInterest[]>([]);
  const [loading, setLoading]     = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [accepting, setAccepting] = React.useState<string | null>(null);
  const [acceptConfirm, setAcceptConfirm] = React.useState<string | null>(null);
  const [declining, setDeclining] = React.useState<string | null>(null);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    try {
      const data = await propertiesApi.getInterests(id);
      setInterests(data as ExtendedInterest[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  React.useEffect(() => { void load(); }, []);

  const handleAccept = async (interestId: string) => {
    setAccepting(interestId);
    try {
      const result = await propertiesApi.acceptInterest(id, interestId);
      router.push(`/agreement/${result.agreementId}`);
    } catch {
      setAccepting(null);
    }
  };

  const handleDecline = async (interestId: string) => {
    setDeclining(interestId);
    try {
      await propertiesApi.declineInterest(id, interestId);
      setInterests(prev =>
        prev.map(i => i.id === interestId ? { ...i, status: InterestStatus.DECLINED } : i),
      );
    } catch {
      // ignore
    } finally {
      setDeclining(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={interests}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListEmptyComponent={
        <Banner variant="info">No one has expressed interest yet.</Banner>
      }
      renderItem={({ item }) => {
        if (item.status !== InterestStatus.PENDING) {
          // Show non-pending as collapsed chip
          return (
            <View style={styles.closedCard}>
              <Text style={styles.closedName}>{item.tenantName ?? 'Tenant'}</Text>
              <InterestStatusChip status={item.status} size="sm" />
            </View>
          );
        }

        if (acceptConfirm === item.id) {
          return (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmName}>{item.tenantName ?? 'Tenant'}</Text>
              <Banner variant="warning">
                Accepting will decline all other requests and create a draft agreement.
              </Banner>
              <View style={styles.confirmRow}>
                <TenantSummaryCard
                  tenantName={item.tenantName ?? 'Tenant'}
                  kycStatus={item.tenantKycStatus ?? KycStatus.PENDING}
                  score={item.tenantScore ?? null}
                  reviewCount={item.tenantReviewCount ?? 0}
                  message={item.message ?? undefined}
                  isLoading={accepting === item.id}
                  onAccept={() => { void handleAccept(item.id); }}
                  onDecline={() => setAcceptConfirm(null)}
                />
              </View>
            </View>
          );
        }

        return (
          <TenantSummaryCard
            tenantName={item.tenantName ?? 'Tenant'}
            kycStatus={item.tenantKycStatus ?? KycStatus.PENDING}
            score={item.tenantScore ?? null}
            reviewCount={item.tenantReviewCount ?? 0}
            message={item.message ?? undefined}
            isLoading={declining === item.id}
            onAccept={() => setAcceptConfirm(item.id)}
            onDecline={() => { void handleDecline(item.id); }}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.base, gap: spacing.md,
    backgroundColor: colors.surface, flexGrow: 1,
  },
  closedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.base,
    ...shadow.card,
  },
  closedName:  { fontSize: fontSize.sm, color: colors.textSec },
  confirmCard: { gap: spacing.sm },
  confirmName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  confirmRow:  {},
});
