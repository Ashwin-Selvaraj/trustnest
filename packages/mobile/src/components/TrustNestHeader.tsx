/**
 * TrustNestHeader — the app-bar shown on all tab screens.
 * Shows the TrustNest wordmark on the left and a bell icon on the right.
 * Push screens (Agreement, Dispute, etc.) use the standard back+title header
 * via expo-router / react-navigation — this component is only for the 4 tabs.
 */

import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, fontSize, fontWeight } from '@trustnest/ui-kit';

// ─── House logo mark (simplified) ────────────────────────────────────────────

function HouseMark(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      {/* Roof */}
      <Path
        d="M14 4L26 15H2L14 4Z"
        fill={colors.primary}
      />
      {/* Wall */}
      <Rect x={5} y={14} width={18} height={11} rx={1} fill={colors.primary} />
      {/* Door */}
      <Rect x={11} y={18} width={6} height={7} rx={1} fill="#FFFFFF" />
      {/* Keyhole */}
      <Circle cx={14} cy={21} r={1.5} fill={colors.primary} />
    </Svg>
  );
}

// ─── Bell icon ────────────────────────────────────────────────────────────────

function BellIcon({ hasUnread }: { hasUnread?: boolean }): React.ReactElement {
  return (
    <View style={bellStyles.wrap}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 10a6 6 0 0 1 12 0v4l2 2H4l2-2v-4Z"
          stroke={colors.text}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path
          d="M10 18a2 2 0 0 0 4 0"
          stroke={colors.text}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
      {hasUnread && <View style={bellStyles.dot} />}
    </View>
  );
}

const bellStyles = StyleSheet.create({
  wrap: { position: 'relative' },
  dot: {
    position:        'absolute',
    top:             0,
    right:           0,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: colors.danger,
    borderWidth:     1.5,
    borderColor:     '#FFFFFF',
  },
});

// ─── Header component ─────────────────────────────────────────────────────────

interface TrustNestHeaderProps {
  hasUnreadNotifications?: boolean;
}

export function TrustNestHeader({
  hasUnreadNotifications = false,
}: TrustNestHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Wordmark */}
      <View style={styles.wordmark}>
        <HouseMark />
        <Text style={styles.appName}>TrustNest</Text>
      </View>

      {/* Right actions */}
      <TouchableOpacity
        style={styles.bellBtn}
        onPress={() => router.push('/(tabs)/notifications')}
        hitSlop={8}
        activeOpacity={0.7}
      >
        <BellIcon hasUnread={hasUnreadNotifications} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 52;

export const TRUSTNEST_HEADER_HEIGHT = HEADER_HEIGHT; // export for screens that need offset

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingBottom:   12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // Shadow (iOS)
    shadowColor:   '#000',
    shadowOpacity: 0.05,
    shadowOffset:  { width: 0, height: 1 },
    shadowRadius:  3,
    // Elevation (Android)
    elevation: 2,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  appName: {
    fontSize:      20,
    fontWeight:    fontWeight.bold,
    color:         colors.text,
    letterSpacing: -0.3,
  },
  bellBtn: {
    padding: 4,
  },
});
