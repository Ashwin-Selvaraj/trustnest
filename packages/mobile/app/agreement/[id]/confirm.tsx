import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { ApiError } from '@/api/client';
import type { Agreement } from '@/types/api';

/**
 * Confirm agreement screen — shows a summary and asks the user to confirm.
 * Both parties must confirm before the NFT is minted and deposit becomes payable.
 */
export default function ConfirmAgreementScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [agreement, setAgreement] = React.useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConfirming, setIsConfirming] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    void agreementsApi
      .get(id)
      .then(setAgreement)
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleConfirm = async (): Promise<void> => {
    if (!id) return;
    setIsConfirming(true);
    try {
      const updated = await agreementsApi.confirm(id);
      setAgreement(updated);
      Alert.alert(
        'Confirmed!',
        updated.tenantConfirmedAt && updated.ownerConfirmedAt
          ? 'Both parties confirmed. The agreement NFT is being minted.'
          : 'Your confirmation is recorded. Waiting for the other party.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Confirmation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading || !agreement) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const formatDate = (d: string): string =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatINR = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Agreement Summary</Text>

        <SummaryRow label="Property" value={agreement.propertyAddress} multiline />
        <Divider />
        <SummaryRow label="Tenant" value={agreement.tenantName} />
        <SummaryRow label="Owner" value={agreement.ownerName} />
        <Divider />
        <SummaryRow label="Monthly Rent" value={formatINR(agreement.rentINR)} />
        <SummaryRow label="Security Deposit" value={formatINR(agreement.depositINR)} />
        <Divider />
        <SummaryRow label="Start" value={formatDate(agreement.startDate)} />
        <SummaryRow label="End" value={formatDate(agreement.endDate)} />
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          By confirming, you agree to the terms of this rental agreement. The security deposit of{' '}
          <Text style={styles.bold}>{formatINR(agreement.depositINR)}</Text> will be held in a
          smart contract escrow on the Polygon blockchain until the agreement ends or a dispute is
          resolved.
        </Text>
      </View>

      <Button
        label="Confirm Agreement"
        variant="primary"
        fullWidth
        loading={isConfirming}
        onPress={() => void handleConfirm()}
      />
      <Button
        label="Go Back"
        variant="secondary"
        fullWidth
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.summaryRow, multiline && styles.summaryRowColumn]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, multiline && styles.summaryValueFull]}>{value}</Text>
    </View>
  );
}

function Divider(): React.ReactElement {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#6B7280' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  summaryRowColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'right',
    flex: 2,
  },
  summaryValueFull: { textAlign: 'left', flex: 1 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  disclaimer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  bold: { fontWeight: '700' },
});
