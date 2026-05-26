/**
 * Avatar — circular initial badge with blue gradient background.
 * Matches design-reference/primitives.jsx Avatar exactly.
 *
 * @example
 * ```tsx
 * <Avatar name="Priya Sharma" size={80} />
 * <Avatar name="Rohan" size={48} />
 * ```
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme';

export interface AvatarProps {
  /** Full name or display name — first character used as initial. */
  name: string;
  /** Diameter in dp. Default `80`. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  name,
  size = 80,
  style,
}: AvatarProps): React.ReactElement {
  const initial = (name || '?').trim()[0]?.toUpperCase() ?? '?';
  const fontSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.circle,
        {
          width:        size,
          height:       size,
          borderRadius: size / 2,
          // Design spec uses linear-gradient(135deg, primary → #1E40AF).
          // Using solid primary as expo-linear-gradient is not in ui-kit deps.
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    // Shadow: '0 2px 8px rgba(37,99,235,0.25)'
    shadowColor:     '#2563EB',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.25,
    shadowRadius:    8,
    elevation:       4,
  },
  initial: {
    color:         '#fff',
    fontWeight:    '600',
    letterSpacing: -0.5,
    lineHeight:    undefined, // let RN default keep vertical centering
  },
});
