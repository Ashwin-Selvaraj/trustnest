import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from '@/store/auth.store';

/**
 * Root layout — wraps the whole app in AuthProvider and sets up deep-link
 * handling for UPI return URLs.
 *
 * Deep link scheme: `trustnest://`
 * UPI return example: `trustnest://payment/return?status=success&agreementId=<uuid>`
 */
function RootLayoutNav(): React.ReactElement {
  const { state } = useAuth();

  // Handle incoming deep links while app is open
  React.useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      // expo-router handles most routing automatically via the scheme
      // registered in app.json; here we handle any custom post-processing
      void url;
    });
    return () => sub.remove();
  }, []);

  if (state.isLoading) {
    // Splash / loading state — expo-router handles the visual via SplashScreen
    return <></>;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {state.isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" />
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
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
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
