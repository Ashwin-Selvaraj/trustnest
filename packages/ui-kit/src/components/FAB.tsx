/**
 * FAB — floating action button (blue + icon).
 * Matches design-reference/primitives.jsx FAB exactly.
 *
 * Positioned with `position: 'absolute'` — wrap the parent screen
 * in `position: 'relative'` and the FAB will sit over the content.
 *
 * @example
 * ```tsx
 * // Inside a <View style={{ flex: 1 }}>:
 * <FAB onPress={() => router.push('/agreement/create')} />
 * // Custom bottom offset (default 96):
 * <FAB onPress={handleAdd} bottom={120} />
 * ```
 */

import * as React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, shadow } from '../theme';

export interface FABProps {
  onPress: () => void;
  /** Distance from the bottom of the container. Default `96`. */
  bottom?: number;
  /** Distance from the right edge. Default `20`. */
  right?: number;
  style?: StyleProp<ViewStyle>;
}

export function FAB({
  onPress,
  bottom = 96,
  right  = 20,
  style,
}: FABProps): React.ReactElement {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={[
        styles.outer,
        { bottom, right, transform: [{ scale }] },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
        hitSlop={8}
      >
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path
            d="M11 4V18M4 11H18"
            stroke="#fff"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    zIndex: 10,
  },
  button: {
    width:            56,
    height:           56,
    borderRadius:     28,
    backgroundColor:  colors.primary,
    alignItems:       'center',
    justifyContent:   'center',
    ...shadow.fab,
  },
});
