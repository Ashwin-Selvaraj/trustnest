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
import { Button } from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { paymentsApi } from '@/api/payments';
import { ApiError } from '@/api/client';
import type { Agreement, InitiatePaymentResponse } from '@/types/api';

type PaymentState = 'idle' | 'initiating' | 'awaiting' | 'polling' | 'confirmed' | 'failed';

/**
 * UPI payment screen — initiates the security deposit payment via Razorpay.
 *
 * Flow:
 * 1. Show deposit amount and initiate CTA.
 * 2. Call /payments/initiate to get a Razorpay order + UPI deep link.
 * 3. Open the UPI app via the deep link.
 * 4. After the UPI app returns, poll the agreement status until ACTIVE.
 * 5. Razorpay webhook → BlockchainJob DEPOSIT_ESCROW → agreement status ACTIVE.
 */
export default function PaymentScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [agreement, setAgreement] = React.useState<Agreement | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<InitiatePaymentResponse | null>(null);
  const [paymentState, setPaymentState] = React.useState<PaymentState>('idle');
  const [isLoadingAgreement, setIsLoadingAgreement] = React.useState(true);

  const pollInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = React.useRef(0);

  React.useEffect(() => {
    if (!id) return;
    void agreementsApi
      .get(id)
      .then(setAgreement)
      .catch((e: Error) => Alert.alert('Error', e.message))
      .finally(() => setIsLoadingAgreement(false));
  }, [id]);

  // Clean up polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const startPolling = (): void => {
    pollCount.current = 0;
    setPaymentState('polling');
    pollInterval.current = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current > 20) {
        // Give up after ~2 minutes
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
      // After returning from UPI app, start polling agreement status
      setTimeout(() => startPolling(), 3000);
    } else {
      Alert.alert(
        'UPI App Not Found',
        'Please install a UPI-enabled app (GPay, PhonePe, Paytm) to pay.',
      );
    }
  };

  if (isLoadingAgreement || !agreement) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  const formatINR = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Amount */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Security Deposit</Text>
        <Text style={styles.amount}>{formatINR(agreement.depositINR)}</Text>
        <Text style={styles.amountHint}>
          This amount will be locked in a smart contract escrow and returned at lease end.
        </Text>
      </View>

      {/* Status messages */}
      {paymentState === 'confirmed' && (
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Payment Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your deposit has been locked in escrow. Your agreement is now active.
          </Text>
          <Button
            label="View Agreement"
            variant="primary"
            onPress={() => router.replace(`/agreement/${id}`)}
          />
        </View>
      )}

      {paymentState === 'polling' && (
        <View style={styles.pollingCard}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.pollingText}>Waiting for payment confirmation…</Text>
          <Text style={styles.pollingSubtext}>This usually takes 30–60 seconds.</Text>
        </View>
      )}

      {(paymentState === 'idle' || paymentState === 'failed') && (
        <Button
          label="Initiate Payment"
          variant="primary"
          fullWidth
          loading={false}
          onPress={() => void handleInitiate()}
        />
      )}

      {paymentState === 'awaiting' && paymentInfo && (
        <View style={styles.upiSection}>
          <Text style={styles.upiTitle}>Open your UPI app to pay</Text>
          <Text style={styles.orderId}>Order: {paymentInfo.orderId}</Text>
          <Button
            label="Open UPI App"
            variant="primary"
            fullWidth
            onPress={() => void handleOpenUPI()}
          />
          <Button
            label="I've Paid — Check Status"
            variant="secondary"
            fullWidth
            onPress={startPolling}
          />
        </View>
      )}

      {paymentState !== 'confirmed' && (
        <Button
          label="Cancel"
          variant="secondary"
          fullWidth
          onPress={() => {
            if (pollInterval.current) clearInterval(pollInterval.current);
            router.back();
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amountCard: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  amountLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  amount: { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
  amountHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#166534' },
  successSubtitle: { fontSize: 14, color: '#15803D', textAlign: 'center', lineHeight: 20 },
  pollingCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  pollingText: { fontSize: 16, fontWeight: '600', color: '#1E40AF' },
  pollingSubtext: { fontSize: 13, color: '#3B82F6' },
  upiSection: { gap: 10 },
  upiTitle: { fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'center' },
  orderId: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
