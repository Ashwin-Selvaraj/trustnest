import * as React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" options={{ headerShown: true, title: 'Verify OTP', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
