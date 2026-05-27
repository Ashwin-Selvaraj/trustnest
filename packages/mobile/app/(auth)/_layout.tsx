import * as React from 'react';
import { Stack, Redirect, usePathname } from 'expo-router';
import { useAuth } from '@/store/auth.store';

// Screens that authenticated users must be able to reach for onboarding
const ONBOARDING_SCREENS = [
  '/(auth)/profile-setup',
  '/(auth)/edit-profile',
  '/(auth)/kyc-intro',
  '/(auth)/kyc-document',
  '/(auth)/kyc-upload',
  '/(auth)/kyc-selfie',
  '/(auth)/kyc-submitted',
  '/(auth)/complete-profile',
  '/(auth)/payment-details',
];

export default function AuthLayout(): React.ReactElement {
  const { state } = useAuth();
  const pathname = usePathname();

  // Redirect authenticated users to tabs ONLY if they're on the
  // phone/otp screens — let them through to onboarding screens
  const isOnboardingScreen = ONBOARDING_SCREENS.some((s) => pathname.startsWith(s.replace('/(auth)', '')));
  if (!state.isLoading && state.isAuthenticated && !isOnboardingScreen) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="phone" />
      <Stack.Screen
        name="otp"
        options={{ headerShown: true, title: 'Verify OTP', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="complete-profile"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="profile-setup"  options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile"   options={{ headerShown: false }} />
      <Stack.Screen name="kyc-intro"      options={{ headerShown: false }} />
      <Stack.Screen name="kyc-document"   options={{ headerShown: false }} />
      <Stack.Screen name="kyc-upload"     options={{ headerShown: false }} />
      <Stack.Screen name="kyc-selfie"     options={{ headerShown: false }} />
      <Stack.Screen name="kyc-submitted"  options={{ headerShown: false }} />
      <Stack.Screen
        name="kyc/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="kyc/aadhaar"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="kyc/pan"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="kyc/selfie"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="kyc/rejected"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="payment-details"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
