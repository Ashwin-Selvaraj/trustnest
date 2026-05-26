import * as React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/store/auth.store';

export default function AuthLayout(): React.ReactElement {
  const { state } = useAuth();

  // Already logged in — send straight to home
  if (!state.isLoading && state.isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" options={{ headerShown: true, title: 'Verify OTP', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
