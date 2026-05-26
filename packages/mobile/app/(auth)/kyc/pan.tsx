import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@trustnest/ui-kit';
import { usersApi } from '@/api/users';
import { ApiError } from '@/api/client';

type Step = 'input' | 'review';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * PAN KYC screen — enter PAN number → under-review state.
 */
export default function PanKycScreen(): React.ReactElement {
  const [step, setStep] = React.useState<Step>('input');
  const [panNumber, setPanNumber] = React.useState('');
  const [panError, setPanError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePanChange = (text: string): void => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPanNumber(cleaned);
    if (cleaned.length === 10) {
      setPanError(PAN_REGEX.test(cleaned) ? null : 'Invalid PAN format (e.g. ABCDE1234F)');
    } else {
      setPanError(null);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!PAN_REGEX.test(panNumber)) {
      setPanError('Invalid PAN format (e.g. ABCDE1234F)');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await usersApi.initiatePanKyc({ panNumber });
      setStep('review');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>PAN Verification</Text>

        {step === 'input' ? (
          <>
            <Text style={styles.subtitle}>
              Enter your 10-character PAN number for identity verification.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PAN Number</Text>
              <TextInput
                style={[styles.input, panError ? styles.inputError : undefined]}
                placeholder="e.g. ABCDE1234F"
                placeholderTextColor="#9CA3AF"
                value={panNumber}
                onChangeText={handlePanChange}
                autoCapitalize="characters"
                maxLength={10}
                returnKeyType="done"
              />
              {panError ? <Text style={styles.fieldError}>{panError}</Text> : null}
              {!panError && panNumber.length > 0 ? (
                <Text style={styles.charCount}>{panNumber.length}/10</Text>
              ) : null}
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={panNumber.length !== 10 || !!panError}
              onPress={() => void handleSubmit()}
              style={styles.button}
            >Submit for Verification</Button>
          </>
        ) : (
          <>
            {/* Under review state */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewIcon}>⏳</Text>
              <Text style={styles.reviewTitle}>Under Review</Text>
              <Text style={styles.reviewDescription}>
                Your PAN details are being verified. This usually takes up to 24 hours.
                You can continue using the app in the meantime.
              </Text>
              <View style={styles.reviewPanRow}>
                <Text style={styles.reviewPanLabel}>PAN:</Text>
                <Text style={styles.reviewPanValue}>
                  {`${panNumber.slice(0, 2)}XXXXXXX${panNumber.slice(-1)}`}
                </Text>
              </View>
            </View>

            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                You will be notified once your verification is complete.
                You can also proceed to take a selfie for additional verification.
              </Text>
            </View>

            <Button
              variant="primary"
              fullWidth
              onPress={() => router.push('/(auth)/kyc/selfie')}
              style={styles.button}
            >Continue to Selfie Check</Button>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 4,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    letterSpacing: 2,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  reviewIcon: {
    fontSize: 40,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  reviewDescription: {
    fontSize: 14,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 21,
  },
  reviewPanRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  reviewPanLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  reviewPanValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1D4ED8',
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
