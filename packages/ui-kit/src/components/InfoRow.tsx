/**
 * InfoRow — label / value pair with optional highlight pill.
 * Used inside Agreement Detail and similar detail screens.
 * Matches design-reference/primitives.jsx InfoRow exactly.
 *
 * @example
 * ```tsx
 * <InfoRow label="Rent / month"   value="₹18,000"   />
 * <InfoRow label="Deposit"        value="₹36,000" highlight />
 * <InfoRow label="Lease end"      value="Dec 2025"   isLast />
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
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

export interface InfoRowProps {
  label:      string;
  /** String or any inline React element. */
  value:      React.ReactNode;
  /** Highlight value with a primary-tinted pill. */
  highlight?: boolean;
  /** Suppresses the bottom divider on the last row in a list. */
  isLast?:    boolean;
  style?:     StyleProp<ViewStyle>;
}

export function InfoRow({
  label,
  value,
  highlight = false,
  isLast    = false,
  style,
}: InfoRowProps): React.ReactElement {
  return (
    <View
      style={[
        styles.row,
        !isLast && styles.rowBorder,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={[
            styles.value,
            highlight && styles.valueHighlight,
          ]}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap:            16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize:  fontSize.md,            // 15
    color:     colors.textSec,
  },
  value: {
    fontSize:   fontSize.md,           // 15
    fontWeight: fontWeight.medium,
    color:      colors.text,
    textAlign:  'right',
  },
  valueHighlight: {
    color:             colors.primary,
    backgroundColor:   colors.primaryLight,
    paddingVertical:   2,
    paddingHorizontal: 8,
    borderRadius:      borderRadius.sm, // 8
    overflow:          'hidden',
  },
});
