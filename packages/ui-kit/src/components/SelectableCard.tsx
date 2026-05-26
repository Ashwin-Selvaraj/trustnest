/**
 * SelectableCard — large radio-style card used for role selection, ID type
 * picker, and any "pick one" screen.  Selected state shows a 2px primary
 * border and a filled blue check circle at the right edge.
 * Matches design-reference/primitives.jsx SelectableCard exactly.
 *
 * @example
 * ```tsx
 * <SelectableCard
 *   selected={role === 'tenant'}
 *   onSelect={() => setRole('tenant')}
 *   icon={<TenantIcon />}
 *   title="I'm a Tenant"
 *   subtitle="Looking for a rental property"
 * />
 * <SelectableCard
 *   selected={idType === 'aadhaar'}
 *   onSelect={() => setIdType('aadhaar')}
 *   title="Aadhaar Card"
 *   subtitle="12-digit Aadhaar number"
 *   badge="Recommended"
 * />
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
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

export interface SelectableCardProps {
  selected?:  boolean;
  onSelect?:  () => void;
  /** Optional icon rendered in a 44×44 square on the left. */
  icon?:      React.ReactNode;
  title:      string;
  subtitle?:  string;
  /** Small success-coloured pill shown next to the title (e.g. "Recommended"). */
  badge?:     string;
  disabled?:  boolean;
  style?:     StyleProp<ViewStyle>;
}

export function SelectableCard({
  selected  = false,
  onSelect,
  icon,
  title,
  subtitle,
  badge,
  disabled  = false,
  style,
}: SelectableCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={() => !disabled && onSelect?.()}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
        style,
      ]}
    >
      {/* Left icon slot */}
      {icon ? (
        <View style={[styles.iconSlot, selected && styles.iconSlotSelected]}>
          {icon}
        </View>
      ) : null}

      {/* Text column */}
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          {badge ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitleText}>{subtitle}</Text>
        ) : null}
      </View>

      {/* Selection indicator — always rendered for layout stability */}
      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
        {selected ? (
          <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <Path
              d="M3 7L6 10L11 4"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    width:          '100%',
    borderRadius:   borderRadius.md,   // 12
    backgroundColor: colors.white,
  },
  cardUnselected: {
    padding:     16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    padding:     15,                   // -1 to compensate for 2px border
    borderWidth: 2,
    borderColor: colors.primary,
    // Glow: '0 0 0 4px rgba(37,99,235,0.10)'
    shadowColor:   '#2563EB',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius:  4,
    elevation:     2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconSlot: {
    width:           44,
    height:          44,
    borderRadius:    borderRadius.md,   // 12
    backgroundColor: colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  iconSlotSelected: {
    backgroundColor: colors.primaryLight,
  },
  textCol: {
    flex:            1,
    gap:             3,
    minWidth:        0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           8,
  },
  titleText: {
    fontSize:      fontSize.base,      // 17
    fontWeight:    fontWeight.semibold,
    color:         colors.text,
    letterSpacing: -0.2,
  },
  badgePill: {
    backgroundColor:   colors.successLight,
    paddingVertical:   2,
    paddingHorizontal: 8,
    borderRadius:      borderRadius.full,
  },
  badgeText: {
    fontSize:   fontSize.xs,           // 11
    fontWeight: fontWeight.semibold,
    color:      colors.success,
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize:   fontSize.sm,           // 13
    color:      colors.textSec,
    lineHeight: 18,
  },
  checkCircle: {
    width:           24,
    height:          24,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     colors.border,
    backgroundColor: 'transparent',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  checkCircleSelected: {
    borderWidth:     0,
    backgroundColor: colors.primary,
  },
});
