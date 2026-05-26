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
import { Button, OtpInput } from '@trustnest/ui-kit';
import { usersApi } from '@/api/users';
import { ApiError } from '@/api/client';

type Step = 'init' | 'verify';

/**
 * Aadhaar KYC screen — two-step: enter Aadhaar number → OTP verification.
 */
export default function AadhaarKycScreen(): React.ReactElement {
  const [step, setStep] = React.useState<Step>('init');
  const [aadhaarNumber, setAadhaarNumber] = React.useState('');
  const [sessionId, setSessionId] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAadhaarChange = (text: string): void => {
    // Only digits
    const cleaned = text.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(cleaned);
  };

  const maskedAadhaar = aadhaarNumber.length === 12
    ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}`
    : aadhaarNumber;

  const handleSendOtp = async (): Promise<void> => {
    if (aadhaarNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersApi.initiateAadhaarKyc({ aadhaarNumber });
      setSessionId(res.sessionId);
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string): Promise<void> => {
    if (code.length < 6) return;
    setIsLoading(true);
    setError(null);
    try {
      await usersApi.verifyAadhaarKyc({ sessionId, otp: code });
      router.push('/(auth)/kyc/selfie');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP. Please try again.');
      setOtp('');
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
        <TouchableOpacity
          onPress={() => (step === 'verify' ? setStep('init') : router.back())}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Aadhaar Verification</Text>

        {step === 'init' ? (
          <>
            <Text style={styles.subtitle}>
              Enter your 12-digit Aadhaar number. An OTP will be sent to your registered mobile.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Aadhaar Number</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : undefined]}
                placeholder="Enter 12-digit number"
                placeholderTextColor="#9CA3AF"
                value={aadhaarNumber.length === 12 ? maskedAadhaar : aadhaarNumber}
                onChangeText={handleAadhaarChange}
                keyboardType="number-pad"
                maxLength={12}
                secureTextEntry={aadhaarNumber.length === 12}
              />
              {aadhaarNumber.length > 0 && aadhaarNumber.length < 12 ? (
                <Text style={styles.charCount}>{aadhaarNumber.length}/12 digits</Text>
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
              disabled={aadhaarNumber.length !== 12}
              onPress={() => void handleSendOtp()}
              style={styles.button}
            >Send OTP</Button>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP sent to your Aadhaar-linked mobile number.
            </Text>

            <View style={styles.maskedBanner}>
              <Text style={styles.maskedLabel}>Aadhaar</Text>
              <Text style={styles.maskedValue}>{maskedAadhaar}</Text>
            </View>

            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={(code) => void handleVerifyOtp(code)}
              error={!!error}
              style={styles.otpInput}
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={otp.length < 6}
              onPress={() => void handleVerifyOtp(otp)}
              style={styles.button}
            >Verify OTP</Button>
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
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    letterSpacing: 1,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  maskedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginBottom: 24,
  },
  maskedLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  maskedValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    letterSpacing: 1,
  },
  otpInput: {
    marginBottom: 16,
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
  button: {
    marginTop: 8,
  },
});
