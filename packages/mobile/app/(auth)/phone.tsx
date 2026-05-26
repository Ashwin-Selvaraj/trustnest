import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Button, TextInput } from '@trustnest/ui-kit';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';

/**
 * Phone number entry screen — step 1 of the OTP auth flow.
 */
export default function PhoneScreen(): React.ReactElement {
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendOtp = async (): Promise<void> => {
    const normalized = phone.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      setError('Enter a valid 10-digit Indian mobile number');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { sessionId } = await authApi.sendOtp({ phone: `+91${normalized}` });
      router.push({ pathname: '/(auth)/otp', params: { phone: `+91${normalized}`, sessionId } });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to send OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Branding */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.title}>TrustNest</Text>
          <Text style={styles.subtitle}>Transparent rental agreements{'\n'}powered by blockchain</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Mobile Number"
            placeholder="98765 43210"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            hint="We'll send a 6-digit OTP to this number"
            autoFocus
          />

          <Button
            label="Send OTP"
            variant="primary"
            fullWidth
            loading={isLoading}
            onPress={() => void handleSendOtp()}
            style={styles.button}
          />
        </View>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
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
  form: {
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
