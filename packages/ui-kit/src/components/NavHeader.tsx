/**
 * NavHeader — back button + centred title + optional right slot.
 * Matches design-reference/primitives.jsx NavHeader exactly.
 *
 * @example
 * ```tsx
 * <NavHeader title="Agreement Details" onBack={() => router.back()} />
 * <NavHeader title="Profile" right={<Button variant="ghost" size="sm">Edit</Button>} />
 * ```
 */

import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../theme';

export interface NavHeaderProps {
  title: string;
  /** Called when the back chevron is pressed. Omit to hide the back button. */
  onBack?: () => void;
  /** Optional element rendered at the right edge (e.g. a ghost Button). */
  right?: React.ReactNode;
  /** Background colour. Defaults to white. */
  bg?: string;
  style?: StyleProp<ViewStyle>;
}

export function NavHeader({
  title,
  onBack,
  right,
  bg    = colors.white,
  style,
}: NavHeaderProps): React.ReactElement {
  return (
    <View style={[styles.header, { backgroundColor: bg }, style]}>
      {/* Back button — always occupies its space for layout stability */}
      <View style={styles.sideSlot}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            hitSlop={8}
          >
            <Svg width={12} height={20} viewBox="0 0 12 20" fill="none">
              <Path
                d="M10 2L2 10l8 8"
                stroke={colors.primary}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        ) : null}
      </View>

      {/* Centred title — absolutely positioned so it's always centred regardless of side slots */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Right slot */}
      <View style={[styles.sideSlot, styles.sideSlotRight]}>
        {right ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height:         52,
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: spacing.sm,   // 8
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexShrink: 0,
  },
  sideSlot: {
    width: 52,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideSlotRight: {
    alignItems: 'flex-end',
    paddingRight: spacing.md,        // 12
  },
  backBtn: {
    width:  44,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: spacing.sm,         // 8
    borderRadius: borderRadius.sm,
  },
  backBtnPressed: {
    backgroundColor: colors.surface,
  },
  title: {
    flex: 1,
    textAlign:      'center',
    fontSize:       fontSize.base,   // 17
    fontWeight:     fontWeight.semibold,
    color:          colors.text,
    letterSpacing:  -0.3,
  },
});
