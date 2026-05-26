import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider } from '@/store/auth.store';

/**
 * Root layout — declares all screens unconditionally.
 * Auth guards live in (tabs)/_layout.tsx and (auth)/_layout.tsx via <Redirect>.
 * Never conditionally add/remove Stack.Screens here — it causes React Navigation
 * to rebuild its Symbol-keyed route state mid-render (→ "cannot convert symbol to string").
 *
 * Deep link scheme: `trustnest://`
 * UPI return: `trustnest://payment/return?status=success&agreementId=<uuid>`
 */
function RootLayoutNav(): React.ReactElement {
  // Handle incoming deep links while app is open
  React.useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      void url; // expo-router handles routing via the scheme in app.json
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="(auth)/complete-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(auth)/kyc"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(auth)/payment-details"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="agreement/[id]"
          options={{ headerShown: true, title: 'Agreement Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="agreement/create"
          options={{ headerShown: true, title: 'New Agreement', presentation: 'modal' }}
        />
        <Stack.Screen
          name="agreement/[id]/confirm"
          options={{ headerShown: true, title: 'Confirm Agreement' }}
        />
        <Stack.Screen
          name="agreement/[id]/payment"
          options={{ headerShown: true, title: 'Pay Deposit' }}
        />
        <Stack.Screen
          name="agreement/[id]/dispute"
          options={{ headerShown: true, title: 'Raise Dispute', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
