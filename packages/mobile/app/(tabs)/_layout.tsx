import * as React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Bottom tab navigator for the authenticated portion of the app.
 * Uses emoji as icons so we don't need to add @expo/vector-icons.
 */
export default function TabsLayout(): React.ReactElement {
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
          tabBarIcon: ({ color }: { color: string; focused: boolean }) => (
            <TabIcon emoji="📋" color={color} />
          ),
          headerTitle: 'My Agreements',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }: { color: string; focused: boolean }) => (
            <TabIcon emoji="👤" color={color} />
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
