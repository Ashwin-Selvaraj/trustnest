import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  NavHeader, Banner, OtpInput, Button,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { useAuth } from '@/store/auth.store';
import { useUserContext } from '@/store/user-context';
import { ApiError } from '@/api/client';

export default function OtpScreen(): React.ReactElement {
  const { phone, sessionId } = useLocalSearchParams<{ phone: string; sessionId: string }>();
  const { signIn, setUser } = useAuth();
  const { setPhone } = useUserContext();

  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(30);

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
      if (phone) setPhone(phone);
      try {
        const user = await usersApi.getMe();
        setUser(user);
        if (!user.profileComplete) {
          router.replace('/(auth)/profile-setup');
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        router.replace('/(auth)/profile-setup');
      }
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <NavHeader title="Verify OTP" onBack={() => router.back()} />

      <View style={styles.container}>
        <Banner variant="info">
          <Text style={styles.bannerText}>
            Enter the 6-digit code sent to{' '}
            <Text style={styles.phoneBold}>{phone}</Text>
          </Text>
        </Banner>

        <OtpInput
          value={otp}
          onChange={setOtp}
          onComplete={(code) => void handleVerify(code)}
          error={!!error}
          style={styles.otpInput}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={otp.length < 6}
          onPress={() => void handleVerify(otp)}
        >
          Verify
        </Button>

        <Pressable
          onPress={() => void handleResend()}
          disabled={resendCountdown > 0}
          style={styles.resendRow}
        >
          <Text style={[styles.resendText, resendCountdown > 0 && styles.resendDisabled]}>
            {resendCountdown > 0
              ? `Resend OTP in ${resendCountdown}s`
              : "Didn't receive the code? Resend"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  bannerText:  { fontSize: fontSize.sm, lineHeight: 20, color: colors.text },
  phoneBold:   { fontWeight: fontWeight.semibold, color: colors.text },
  otpInput:    { marginVertical: spacing.sm },
  errorText: {
    fontSize:   fontSize.sm,
    color:      colors.danger,
    textAlign:  'center',
    marginTop:  -spacing.xs,
  },
  resendRow: { alignItems: 'center', paddingVertical: spacing.sm },
  resendText: {
    fontSize:   fontSize.sm,
    color:      colors.primary,
    fontWeight: fontWeight.medium,
  },
  resendDisabled: { color: colors.textSec },
});
