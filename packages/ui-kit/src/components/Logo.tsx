/**
 * Logo — TrustNest "house" mark.  Pure SVG, no emoji.
 * Matches design-reference/primitives.jsx Logo exactly.
 *
 * @example
 * ```tsx
 * <Logo size={64} />
 * <Logo size={48} />
 * ```
 */

import * as React from 'react';
import {
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

export interface LogoProps {
  /** Size in dp — applies to both width and height. Default `64`. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Logo({
  size  = 64,
  style,
}: LogoProps): React.ReactElement {
  const iconSize = Math.round(size * 0.6);
  const radius   = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width:           size,
          height:          size,
          borderRadius:    radius,
          // Design spec: linear-gradient(135deg, primary → #1E40AF).
          // Using solid primary as expo-linear-gradient is not in ui-kit deps.
          backgroundColor: colors.primary,
        },
        style,
      ]}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none">
        {/* Filled house shape */}
        <Path
          d="M16 4L28 13V27a1 1 0 01-1 1H5a1 1 0 01-1-1V13L16 4Z"
          fill="#fff"
          fillOpacity={0.95}
        />
        {/* Door */}
        <Path
          d="M12 28V19h8v9"
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Keyhole dot */}
        <Circle cx={16} cy={14} r={1.5} fill={colors.primary} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
    // '0 6px 20px rgba(37,99,235,0.35), 0 2px 4px rgba(37,99,235,0.2)'
    shadowColor:    '#2563EB',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.35,
    shadowRadius:   20,
    elevation:      8,
  },
});
