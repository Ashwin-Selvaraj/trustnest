import * as React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Platform, ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/auth.store';

/**
 * Bottom tab navigator for the authenticated portion of the app.
 * Uses emoji as icons so we don't need to add @expo/vector-icons.
 */
export default function TabsLayout(): React.ReactElement {
  const { state } = useAuth();

  // Still restoring tokens from SecureStore — show spinner
  if (state.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Not logged in — send to phone login screen
  if (!state.isAuthenticated) {
    return <Redirect href="/(auth)/phone" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#111827',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Agreements',
          tabBarLabel: 'Agreements',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="📋" color={String(color)} />
          ),
          headerTitle: 'My Agreements',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="👤" color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji }: { emoji: string; color: string }): React.ReactElement {
  const { Text } = require('react-native') as typeof import('react-native');
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
