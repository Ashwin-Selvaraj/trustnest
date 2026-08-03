/**
 * Skeleton — shape-matched loading placeholders with a soft opacity pulse.
 *
 * Perceived-performance principle: skeletons that mirror the real content's
 * silhouette read as "almost there", where spinners read as "please wait".
 * Pulse is a gentle 1s opacity loop (0.45 → 1) — calm, not attention-seeking.
 *
 * @example
 * ```tsx
 * <Skeleton width={180} height={16} />
 * <Skeleton width="100%" height={200} radius={borderRadius.md} />
 * <PropertyCardSkeleton />   // full listing-card silhouette
 * ```
 */

import * as React from 'react';
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

// Single shared pulse so every skeleton on screen breathes in sync —
// out-of-phase pulsing reads as flicker.
let sharedPulse: Animated.Value | null = null;
function getPulse(): Animated.Value {
  if (!sharedPulse) {
    sharedPulse = new Animated.Value(0.45);
    Animated.loop(
      Animated.sequence([
        Animated.timing(sharedPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sharedPulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }
  return sharedPulse;
}

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = borderRadius.sm,
  style,
}: SkeletonProps): React.ReactElement {
  const opacity = getPulse();
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.statusGreyBg, opacity },
        style,
      ]}
    />
  );
}

/** Silhouette of a PropertyCard for the browse feed loading state. */
export function PropertyCardSkeleton({ style }: { style?: StyleProp<ViewStyle> }): React.ReactElement {
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={180} radius={0} />
      <View style={styles.cardBody}>
        <Skeleton width="75%" height={18} />
        <Skeleton width="45%" height={13} />
        <View style={styles.chipRow}>
          <Skeleton width={64} height={24} radius={borderRadius.full} />
          <Skeleton width={64} height={24} radius={borderRadius.full} />
        </View>
        <Skeleton width="55%" height={17} />
        <View style={styles.ownerRow}>
          <Skeleton width={28} height={28} radius={14} />
          <Skeleton width={110} height={13} />
        </View>
      </View>
    </View>
  );
}

/** Silhouette of a list row (alerts, agreements, generic lists). */
export function ListRowSkeleton({ style }: { style?: StyleProp<ViewStyle> }): React.ReactElement {
  return (
    <View style={[styles.row, style]}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={styles.rowBody}>
        <Skeleton width="60%" height={15} />
        <Skeleton width="90%" height={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
});
