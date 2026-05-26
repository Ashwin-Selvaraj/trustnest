/**
 * Checkbox — labelled boolean toggle.
 * Matches design-reference/primitives.jsx Checkbox exactly.
 *
 * @example
 * ```tsx
 * <Checkbox checked={agreed} onChange={setAgreed}>
 *   I agree to the rental agreement terms.
 * </Checkbox>
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
import { colors, fontSize } from '../theme';

export interface CheckboxProps {
  checked:   boolean;
  onChange:  (next: boolean) => void;
  children?: React.ReactNode;
  /** Override the outer row container style. */
  style?:    StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onChange,
  children,
  style,
}: CheckboxProps): React.ReactElement {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, style]}
      hitSlop={4}
    >
      {/* Box */}
      <View
        style={[
          styles.box,
          checked ? styles.boxChecked : styles.boxUnchecked,
        ]}
      >
        {checked ? (
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

      {/* Label */}
      {children ? (
        <Text style={styles.label}>{children}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  box: {
    width:          22,
    height:         22,
    borderRadius:   6,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    marginTop:      1,
  },
  boxUnchecked: {
    backgroundColor: colors.white,
    borderColor:     colors.borderStrong,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  label: {
    flex:       1,
    fontSize:   fontSize.md,           // 15
    color:      colors.text,
    lineHeight: 21,                    // ≈ 15 × 1.4
  },
});
