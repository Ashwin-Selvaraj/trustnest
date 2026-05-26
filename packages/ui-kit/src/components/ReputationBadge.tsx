/**
 * ReputationBadge — on-chain SBT reputation display.
 * Shows the SBT mark, numeric score, fractional star row, and review count.
 * Matches design-reference/primitives.jsx ReputationBadge exactly.
 *
 * @example
 * ```tsx
 * <ReputationBadge score={4.5} reviews={12} />
 * <ReputationBadge hasReviews={false} />
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
import Svg, { Path } from 'react-native-svg';
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReputationBadgeProps {
  /**
   * Average score on a 1–5 scale (accepts decimals, e.g. 4.5).
   * Ignored when `hasReviews` is false.
   */
  score?:       number;
  /** Number of completed agreements rated. */
  reviews?:     number;
  /**
   * Whether the user has any reviews.  Pass `false` to show the empty-state
   * copy.  Defaults to `true`.
   */
  hasReviews?:  boolean;
  style?:       StyleProp<ViewStyle>;
}

// ─── SBT hexagon mark ────────────────────────────────────────────────────────

function SbtMark(): React.ReactElement {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      {/* Outer hexagon */}
      <Path
        d="M14 3L24 8.5V19.5L14 25L4 19.5V8.5L14 3Z"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={0.95}
      />
      {/* Inner hexagon (filled) */}
      <Path
        d="M14 9.5L18.5 12V17L14 19.5L9.5 17V12L14 9.5Z"
        fill="#fff"
        opacity={0.95}
      />
    </Svg>
  );
}

// ─── Fractional star row ──────────────────────────────────────────────────────

const STAR_PATH = 'M7 1L8.8 5L13 5.6L10 8.8L10.8 13L7 11L3.2 13L4 8.8L1 5.6L5.2 5L7 1Z';
const STAR_GOLD   = '#F59E0B';
const STAR_EMPTY  = colors.border;

function StarFull({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}

function Stars({
  value = 0,
  size  = 14,
}: {
  value?: number;
  size?:  number;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <View key={i} style={{ width: size, height: size }}>
            {/* Empty star layer */}
            <StarFull size={size} color={STAR_EMPTY} />
            {/* Clipped gold layer */}
            {fill > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top:      0,
                  left:     0,
                  width:    size * fill,
                  height:   size,
                  overflow: 'hidden',
                }}
              >
                <StarFull size={size} color={STAR_GOLD} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReputationBadge({
  score      = 0,
  reviews    = 0,
  hasReviews = true,
  style,
}: ReputationBadgeProps): React.ReactElement {
  // Round to nearest 0.5 for star display (matches spec)
  const starValue = Math.round((score || 0) * 2) / 2;

  return (
    <View style={[styles.container, style]}>
      {/* Blue gradient SBT square */}
      <View style={styles.sbtSquare}>
        <SbtMark />
      </View>

      {/* Right column */}
      <View style={styles.infoCol}>
        {hasReviews ? (
          <>
            {/* Score row */}
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
              <Text style={styles.scoreMax}> / 5.0</Text>
            </View>
            <Stars value={starValue} size={14} />
            <Text style={styles.reviewText}>
              {reviews} review{reviews !== 1 ? 's' : ''} · verified on-record
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyBody}>
              Your reputation grows with each completed lease.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
  },
  sbtSquare: {
    width:          56,
    height:         56,
    borderRadius:   borderRadius.md,    // 12
    // spec: linear-gradient(135deg, primary → #1E40AF). Using solid primary.
    backgroundColor: colors.primary,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    shadowColor:    '#2563EB',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.25,
    shadowRadius:   6,
    elevation:      3,
  },
  infoCol: {
    flexDirection: 'column',
    gap:           2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           0,
  },
  scoreText: {
    fontSize:      fontSize.xxl,        // 30
    fontWeight:    fontWeight.bold,
    color:         colors.text,
    letterSpacing: -0.6,
    lineHeight:    30,
  },
  scoreMax: {
    fontSize:   fontSize.md,            // 15
    color:      colors.textSec,
    lineHeight: 22,
  },
  reviewText: {
    fontSize:   fontSize.sm,            // 13
    color:      colors.textSec,
    marginTop:  2,
  },
  emptyTitle: {
    fontSize:   fontSize.base,          // 17
    fontWeight: fontWeight.semibold,
    color:      colors.text,
  },
  emptyBody: {
    fontSize:   fontSize.sm,            // 13
    color:      colors.textSec,
    lineHeight: 19,
  },
});
