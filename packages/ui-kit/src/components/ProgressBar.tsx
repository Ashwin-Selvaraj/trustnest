/**
 * ProgressBar — slim 4 dp step-progress indicator used in the KYC stepper
 * and any multi-step flow.
 * Matches design-reference/primitives.jsx ProgressBar exactly.
 *
 * @example
 * ```tsx
 * <ProgressBar step={2} total={4} />
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
import { colors, fontSize, fontWeight } from '../theme';

export interface ProgressBarProps {
  /** Current step (1-based). */
  step:   number;
  /** Total number of steps. */
  total:  number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  step,
  total,
  style,
}: ProgressBarProps): React.ReactElement {
  const pct = Math.max(0, Math.min(1, step / total)) * 100;

  return (
    <View style={[styles.container, style]}>
      {/* Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as `${number}%` }]} />
      </View>
      {/* Label */}
      <Text style={styles.label}>Step {step} of {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.border,
    overflow:        'hidden',
  },
  fill: {
    height:          '100%',
    borderRadius:    2,
    backgroundColor: colors.primary,
  },
  label: {
    marginTop:     8,
    fontSize:      fontSize.xs,         // 11
    fontWeight:    fontWeight.medium,
    color:         colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
