import * as React from 'react';
import { Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconHome, IconBrowse, IconBell, IconPerson } from '@trustnest/ui-kit';
import { useAuth } from '@/store/auth.store';
import { TrustNestHeader } from '@/components/TrustNestHeader';

/**
 * Bottom tab navigator. Guests are welcome here — browsing/discovery is
 * public (traditional marketplace UX). Screens that act on the user's
 * behalf (Home, Alerts, Profile, express-interest, listing) render a
 * SignInPrompt themselves when there is no session.
 */
export default function TabsLayout(): React.ReactElement {
  const { state } = useAuth();
  const insets = useSafeAreaInsets();

  // Still restoring tokens from storage — show spinner
  if (state.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        // Use TrustNestHeader on all tab screens
        header: () => <TrustNestHeader />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <IconHome color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color }) => <IconBrowse color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <IconBell color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <IconPerson color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
