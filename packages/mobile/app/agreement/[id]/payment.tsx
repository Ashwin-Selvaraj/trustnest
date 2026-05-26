import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  NavHeader, Banner, Button,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { paymentsApi } from '@/api/payments';
import { ApiError } from '@/api/client';
import type { Agreement, InitiatePaymentResponse } from '@/types/api';

type PaymentState = 'idle' | 'initiating' | 'awaiting' | 'polling' | 'confirmed' | 'failed';

export default function PaymentScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [agreement, setAgreement]     = React.useState<Agreement | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<InitiatePaymentResponse | null>(null);
  const [paymentState, setPaymentState] = React.useState<PaymentState>('idle');
  const [isLoadingAgreement, setIsLoadingAgreement] = React.useState(true);

  const pollInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount    = React.useRef(0);

  React.useEffect(() => {
    if (!id) return;
    void agreementsApi
      .get(id)
      .then(setAgreement)
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setIsLoadingAgreement(false));
  }, [id]);

  React.useEffect(() => {
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, []);

  const startPolling = (): void => {
    pollCount.current = 0;
    setPaymentState('polling');
    pollInterval.current = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current > 20) {
        if (pollInterval.current) clearInterval(pollInterval.current);
        setPaymentState('awaiting');
        return;
      }
      void agreementsApi
        .get(id ?? '')
        .then((a) => {
          if (a.status === 'ACTIVE' || a.status === 'RELEASING') {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setAgreement(a);
            setPaymentState('confirmed');
          }
        })
        .catch(() => undefined);
    }, 6000);
  };

  const handleInitiate = async (): Promise<void> => {
    if (!id) return;
    setPaymentState('initiating');
    try {
      const info = await paymentsApi.initiate({ agreementId: id });
      setPaymentInfo(info);
      setPaymentState('awaiting');
    } catch (err: unknown) {
      setPaymentState('failed');
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Could not create payment order');
    }
  };

  const handleOpenUPI = async (): Promise<void> => {
    if (!paymentInfo) return;
    const canOpen = await Linking.canOpenURL(paymentInfo.upiDeepLink);
    if (canOpen) {
      await Linking.openURL(paymentInfo.upiDeepLink);
      setTimeout(() => startPolling(), 3000);
    } else {
      Alert.alert('UPI App Not Found', 'Please install a UPI-enabled app (GPay, PhonePe, Paytm) to pay.');
    }
  };

  if (isLoadingAgreement || !agreement) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const formatINR = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <NavHeader title="Pay Deposit" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount hero */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Security Deposit</Text>
          <Text style={styles.amount}>{formatINR(agreement.depositINR)}</Text>
        </View>

        {/* Idle — info banner */}
        {(paymentState === 'idle' || paymentState === 'initiating') && (
          <Banner variant="info">
            Your deposit will be locked in a smart-contract escrow until the lease ends.
          </Banner>
        )}

        {/* Confirmed */}
        {paymentState === 'confirmed' && (
          <Banner variant="success">
            ✅ Payment confirmed! Your deposit is locked in escrow. Your agreement is now active.
          </Banner>
        )}

        {/* Polling */}
        {paymentState === 'polling' && (
          <Banner variant="info">
            ⏳ Waiting for payment confirmation — this usually takes 30–60 seconds…
          </Banner>
        )}

        {/* Failed */}
        {paymentState === 'failed' && (
          <Banner variant="warning">
            Payment could not be processed. Please try again.
          </Banner>
        )}

        {/* Awaiting — UPI deep link */}
        {paymentState === 'awaiting' && paymentInfo && (
          <View style={styles.upiSection}>
            <Text style={styles.upiTitle}>Open your UPI app to pay</Text>
            <Text style={styles.orderId}>Order: {paymentInfo.orderId}</Text>
            <Button variant="primary" fullWidth onPress={() => void handleOpenUPI()}>
              Open UPI App
            </Button>
            <Button variant="secondary" fullWidth onPress={startPolling}>
              I've Paid — Check Status
            </Button>
          </View>
        )}

        {/* CTAs */}
        {(paymentState === 'idle' || paymentState === 'initiating' || paymentState === 'failed') && (
          <Button
            variant="primary"
            fullWidth
            loading={paymentState === 'initiating'}
            onPress={() => void handleInitiate()}
          >
            Initiate Payment
          </Button>
        )}

        {paymentState === 'confirmed' && (
          <Button variant="primary" fullWidth onPress={() => router.replace(`/agreement/${id}`)}>
            View Agreement
          </Button>
        )}

        {paymentState !== 'confirmed' && (
          <Button
            variant="secondary"
            fullWidth
            onPress={() => {
              if (pollInterval.current) clearInterval(pollInterval.current);
              router.back();
            }}
          >
            Cancel
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.surface },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:    { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['2xl'] },
  amountCard: {
    backgroundColor: colors.primary,
    borderRadius:    16,
    padding:         spacing.xl,
    alignItems:      'center',
    gap:             spacing.xs,
  },
  amountLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: fontWeight.medium },
  amount:      { fontSize: 40, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  upiSection:  { gap: spacing.sm },
  upiTitle: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
    textAlign:  'center',
  },
  orderId:     { fontSize: fontSize.xs, color: colors.textSec, textAlign: 'center' },
});
