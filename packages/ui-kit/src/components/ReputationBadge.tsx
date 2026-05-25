import * as React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface ReputationBadgeProps {
  /**
   * Average score on a 1–5 scale. Accepts fractional values (e.g. 4.5).
   * Pass `null` or `undefined` for new users with no ratings.
   */
  averageScore?: number | null;
  /** Total number of completed agreements rated. */
  tokenCount?: number;
  /** Compact mode shows only the star and numeric average. */
  compact?: boolean;
  /** Override container style. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Displays a star rating badge with the average score and review count.
 *
 * @example
 * ```tsx
 * <ReputationBadge averageScore={4.5} tokenCount={12} />
 * <ReputationBadge averageScore={null} tokenCount={0} />
 * <ReputationBadge averageScore={3.8} tokenCount={5} compact />
 * ```
 */
export function ReputationBadge({
  averageScore,
  tokenCount = 0,
  compact = false,
  style,
}: ReputationBadgeProps): React.ReactElement {
  const hasScore = averageScore != null && averageScore > 0;
  const displayScore = hasScore ? averageScore!.toFixed(1) : '–';

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text style={styles.starIcon}>★</Text>
        <Text style={styles.compactScore}>{displayScore}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={styles.starIcon}>★</Text>
        <Text style={styles.score}>{displayScore}</Text>
      </View>
      <Text style={styles.count}>
        {tokenCount === 0
          ? 'No reviews yet'
          : `${tokenCount} review${tokenCount !== 1 ? 's' : ''}`}
      </Text>
      {hasScore ? <StarBar score={averageScore!} /> : null}
    </View>
  );
}

function StarBar({ score }: { score: number }): React.ReactElement {
  return (
    <View style={styles.starBar}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = score >= star;
        const half = !filled && score >= star - 0.5;
        return (
          <Text
            key={star}
            style={[
              styles.starBarItem,
              filled
                ? styles.starFilled
                : half
                  ? styles.starHalf
                  : styles.starEmpty,
            ]}
          >
            ★
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starIcon: {
    fontSize: 18,
    color: colors.warning,
    lineHeight: 22,
  },
  score: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightBold,
    color: colors.text,
  },
  count: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  starBar: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  starBarItem: {
    fontSize: 16,
  },
  starFilled: {
    color: colors.warning,
  },
  starHalf: {
    color: colors.warning,
    opacity: 0.5,
  },
  starEmpty: {
    color: colors.border,
  },
  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactScore: {
    fontSize: typography.fontSizeBase,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.text,
  },
});
