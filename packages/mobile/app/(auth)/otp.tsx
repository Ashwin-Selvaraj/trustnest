import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OtpInput, Button } from '@trustnest/ui-kit';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { useAuth } from '@/store/auth.store';
import { ApiError } from '@/api/client';

/**
 * OTP verification screen — step 2 of the auth flow.
 * Receives `phone` as a route param from the phone screen.
 */
export default function OtpScreen(): React.ReactElement {
  const { phone, sessionId } = useLocalSearchParams<{ phone: string; sessionId: string }>();
  const { signIn, setUser } = useAuth();

  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(30);

  // Countdown timer for resend
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleVerify = async (code: string): Promise<void> => {
    if (code.length < 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await authApi.verifyOtp({ sessionId: sessionId ?? '', otp: code });
      await signIn(tokens.accessToken, tokens.refreshToken);
      // Fetch user profile after sign in
      try {
        const user = await usersApi.getMe();
        setUser(user);
      } catch {
        // Non-fatal — user will be fetched on home screen
      }
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (resendCountdown > 0 || !phone) return;
    try {
      await authApi.sendOtp({ phone });
      setResendCountdown(30);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to resend OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>
        </View>

        <OtpInput
          value={otp}
          onChangeValue={setOtp}
          onComplete={(code) => void handleVerify(code)}
          hasError={!!error}
          style={styles.otpInput}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Verify"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={otp.length < 6}
          onPress={() => void handleVerify(otp)}
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => void handleResend()}
          disabled={resendCountdown > 0}
          style={styles.resendRow}
        >
          <Text style={[styles.resendText, resendCountdown > 0 && styles.resendDisabled]}>
            {resendCountdown > 0
              ? `Resend OTP in ${resendCountdown}s`
              : "Didn't receive the code? Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  phone: {
    fontWeight: '600',
    color: '#111827',
  },
  otpInput: {
    marginBottom: 16,
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 20,
  },
  resendRow: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  resendDisabled: {
    color: '#9CA3AF',
  },
});
