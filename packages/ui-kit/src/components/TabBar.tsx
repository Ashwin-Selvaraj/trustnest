/**
 * TabBar — bottom navigation with 4 tabs.
 * Tab 2 label is role-aware: tenant → "Browse", owner/both → "Properties".
 * Matches design-reference/primitives.jsx TabBar exactly.
 *
 * @example
 * ```tsx
 * <TabBar active="home" onChange={setTab} role="tenant" notifCount={3} />
 * ```
 */

import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fontSize, fontWeight, spacing } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabId = 'home' | 'browse' | 'notifications' | 'profile';

export interface TabBarProps {
  active:      TabId;
  onChange:    (tab: TabId) => void;
  /**
   * Viewer's role — controls the "Browse" vs "Properties" label on tab 2.
   * Defaults to `'tenant'`.
   */
  role?:       'tenant' | 'owner' | 'both';
  /** Badge count shown on the Notifications tab. */
  notifCount?: number;
  style?:      StyleProp<ViewStyle>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHome({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11L12 3L21 11V20a1 1 0 01-1 1h-5v-7h-4v7H4a1 1 0 01-1-1V11z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconBrowse({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={1.8} />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function IconBell({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9a6 6 0 0112 0v4l2 3H4l2-3V9Z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      <Path d="M10 19a2 2 0 004 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function IconPerson({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TabBar({
  active,
  onChange,
  role       = 'tenant',
  notifCount = 0,
  style,
}: TabBarProps): React.ReactElement {
  const browseLabel = role === 'owner' || role === 'both' ? 'Properties' : 'Browse';

  const tabs: Array<{
    id:    TabId;
    label: string;
    Icon:  React.ComponentType<{ color: string }>;
    badge?: number;
  }> = [
    { id: 'home',          label: 'Home',      Icon: IconHome   },
    { id: 'browse',        label: browseLabel,  Icon: IconBrowse },
    { id: 'notifications', label: 'Alerts',    Icon: IconBell,  badge: notifCount },
    { id: 'profile',       label: 'Profile',   Icon: IconPerson },
  ];

  return (
    <View style={[styles.bar, style]}>
      {tabs.map(({ id, label, Icon, badge }) => {
        const isActive = active === id;
        const iconColor = isActive ? colors.primary : colors.textSec;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <View style={styles.iconWrap}>
              <Icon color={iconColor} />
              {badge && badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection:      'row',
    borderTopWidth:     1,
    borderTopColor:     colors.border,
    backgroundColor:    'rgba(255,255,255,0.94)',
    paddingTop:         spacing.sm,    // 8
    paddingBottom:      22,            // safe area handled by screen; extra bottom padding
  },
  tab: {
    flex: 1,
    alignItems:   'center',
    gap: 3,
    paddingVertical: 6,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position:      'absolute',
    top:           -3,
    right:         -8,
    minWidth:      16,
    height:        16,
    paddingHorizontal: 3,
    borderRadius:  8,
    backgroundColor: colors.danger,
    borderWidth:   1.5,
    borderColor:   colors.white,
    alignItems:    'center',
    justifyContent:'center',
  },
  badgeText: {
    fontSize:   10,
    fontWeight: fontWeight.bold,
    color:      colors.white,
    lineHeight: 13,
  },
  label: {
    fontSize:   10,
    fontWeight: fontWeight.medium,
    color:      colors.textSec,
  },
  labelActive: {
    color: colors.primary,
  },
});
