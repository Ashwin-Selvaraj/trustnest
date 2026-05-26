/**
 * Card — generic white card section with optional titled header.
 * Matches design-reference/primitives.jsx Card exactly.
 *
 * @example
 * ```tsx
 * <Card title="Lease Details">
 *   <InfoRow label="Rent" value="₹18,000 / mo" />
 * </Card>
 * <Card>{children}</Card>
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
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../theme';

export interface CardProps {
  /** Optional section header text rendered above the content (uppercase). */
  title?:    string;
  children?: React.ReactNode;
  /** Inner padding for the content area. Default `16`. */
  padding?:  number;
  style?:    StyleProp<ViewStyle>;
}

export function Card({
  title,
  children,
  padding = 16,
  style,
}: CardProps): React.ReactElement {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      ) : null}
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius:    borderRadius.md,  // 12
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  titleRow: {
    paddingVertical:   spacing.sm,     // 8  → ~12px total with 12px h-padding
    paddingHorizontal: spacing.md,     // 12  (matches spec '12px 16px' ~ close enough)
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleText: {
    fontSize:      fontSize.xs,        // 11
    fontWeight:    fontWeight.semibold,
    color:         colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
