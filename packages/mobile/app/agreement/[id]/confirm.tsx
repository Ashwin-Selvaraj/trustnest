import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  NavHeader, Card, Banner, Checkbox, Button, InfoRow, SectionHeader,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { ApiError } from '@/api/client';
import type { Agreement } from '@/types/api';

export default function ConfirmAgreementScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [agreement, setAgreement]   = React.useState<Agreement | null>(null);
  const [isLoading, setIsLoading]   = React.useState(true);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [agreed, setAgreed]         = React.useState(false);

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
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const formatDate = (d: string): string =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmt = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <NavHeader title="Review Agreement" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary card */}
        <Card style={styles.card}>
          <SectionHeader>Agreement Summary</SectionHeader>

          <Text style={styles.address} numberOfLines={2}>{agreement.propertyAddress}</Text>

          <InfoRow label="Tenant"  value={agreement.tenantName} />
          <InfoRow label="Owner"   value={agreement.ownerName} />
          <InfoRow label="Monthly Rent"     value={fmt(agreement.rentINR)}    highlight />
          <InfoRow label="Security Deposit" value={fmt(agreement.depositINR)} />
          <InfoRow label="Start"   value={formatDate(agreement.startDate)} />
          <InfoRow label="End"     value={formatDate(agreement.endDate)} />
        </Card>

        {/* Disclaimer */}
        <Banner variant="warning">
          By confirming, you agree to the terms stored on-chain. The security deposit of{' '}
          <Text style={styles.bold}>{fmt(agreement.depositINR)}</Text> will be held in a
          smart contract escrow on Polygon until the agreement ends or a dispute is resolved.
          This action cannot be undone.
        </Banner>

        {/* Checkbox consent */}
        <Checkbox checked={agreed} onChange={setAgreed}>
          I understand and agree to the terms above
        </Checkbox>

        {/* Actions */}
        <View style={styles.buttons}>
          <Button
            variant="primary"
            fullWidth
            loading={isConfirming}
            disabled={!agreed}
            onPress={() => void handleConfirm()}
          >
            Confirm Agreement
          </Button>
          <Button variant="secondary" fullWidth onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.surface },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:    { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['2xl'] },
  card:       { gap: spacing.sm },
  address: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  bold:       { fontWeight: fontWeight.bold },
  buttons:    { gap: spacing.sm },
});
