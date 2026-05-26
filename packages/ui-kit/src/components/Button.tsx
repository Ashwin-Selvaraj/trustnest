/**
 * Button — primary | secondary | destructive | ghost
 *
 * Props API mirrors design-reference/primitives.jsx Button exactly
 * (with `onPress` in place of `onClick` and `children` for content).
 *
 * @example
 * ```tsx
 * <Button variant="primary" onPress={handlePay}>Pay Deposit</Button>
 * <Button variant="secondary" onPress={handleCancel}>Cancel</Button>
 * <Button variant="destructive" loading={isSubmitting}>Raise Dispute</Button>
 * <Button variant="ghost" onPress={handleSkip}>Skip for now</Button>
 * <Button variant="primary" fullWidth size="lg" onPress={handleContinue}>Continue</Button>
 * ```
 */

import * as React from 'react';
import {
  Pressable,
  Text,
  View,
  Animated,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, borderRadius, fontSize, fontWeight } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  /** Button content — usually a string, but accepts any ReactNode. */
  children?: React.ReactNode;
  /** Visual variant. Default: `'primary'`. */
  variant?: ButtonVariant;
  /** Size preset controlling height and font size. Default: `'md'`. */
  size?: ButtonSize;
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
  /** Stretches the button to fill its parent container. */
  fullWidth?: boolean;
  /** Override button container style (applied to the Pressable). */
  style?: StyleProp<ViewStyle>;
  /** Override label text style. */
  labelStyle?: StyleProp<TextStyle>;
}

// ─── Per-variant config ───────────────────────────────────────────────────────

interface VariantConfig {
  bg:           string;
  fg:           string;
  border:       string;
  pressedBg:    string;
  spinnerColor: string;
}

const VARIANT: Record<ButtonVariant, VariantConfig> = {
  primary: {
    bg:           colors.primary,
    fg:           '#fff',
    border:       colors.primary,
    pressedBg:    colors.primaryDark,   // #1D4ED8
    spinnerColor: '#fff',
  },
  secondary: {
    bg:           '#fff',
    fg:           colors.text,
    border:       colors.borderStrong,  // #D1D5DB — spec uses borderStrong, not border
    pressedBg:    colors.surface,       // #F9FAFB
    spinnerColor: colors.primary,
  },
  destructive: {
    bg:           colors.danger,
    fg:           '#fff',
    border:       colors.danger,
    pressedBg:    colors.dangerDark,    // #991B1B — spec: '#B91C1C' ≈ dangerDark
    spinnerColor: '#fff',
  },
  ghost: {
    bg:           'transparent',
    fg:           colors.primary,
    border:       'transparent',
    pressedBg:    colors.primaryLight,  // #EFF6FF
    spinnerColor: colors.primary,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  children,
  variant      = 'primary',
  size         = 'md',
  loading      = false,
  fullWidth    = false,
  disabled,
  style,
  labelStyle,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled === true || loading;
  const v = VARIANT[variant];

  // ── Scale animation (spec: transform scale(0.985) on press) ────────────────
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = React.useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (!isDisabled) {
        Animated.timing(scale, {
          toValue: 0.985,
          duration: 80,
          useNativeDriver: true,
        }).start();
      }
      onPressIn?.(e);
    },
    [isDisabled, scale, onPressIn],
  );

  const handlePressOut = React.useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  return (
    // Outer Animated.View owns the scale transform.
    // fullWidth is applied here so the wrapper also takes full width.
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          // Height preset
          styles[`size_${size}` as 'size_sm' | 'size_md' | 'size_lg'],
          // Static variant colours
          {
            backgroundColor: v.bg,
            borderColor: v.border,
          },
          // Pressed colour override (replaces bg only, border stays)
          pressed && !isDisabled && { backgroundColor: v.pressedBg },
          // Width
          fullWidth && styles.fullWidth,
          !fullWidth && styles.minWidth,
          // Disabled opacity
          isDisabled && styles.disabled,
          // Consumer override
          style,
        ]}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.spinnerColor} />
        ) : (
          <View style={styles.inner}>
            {typeof children === 'string' ? (
              <Text
                style={[
                  styles.label,
                  styles[`labelSize_${size}` as 'labelSize_sm' | 'labelSize_md' | 'labelSize_lg'],
                  { color: v.fg },
                  labelStyle,
                ]}
                numberOfLines={1}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,    // 12 — matches spec R.md
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  minWidth: {
    minWidth: 120,                    // spec: minWidth 120 when not fullWidth
  },
  disabled: {
    opacity: 0.5,
  },

  // ── Size presets (height matches spec exactly) ────────────────────────────
  size_sm: {
    height: 36,
    paddingHorizontal: 14,
  },
  size_md: {
    height: 48,
    paddingHorizontal: 20,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 24,
  },

  // ── Label typography ──────────────────────────────────────────────────────
  label: {
    fontWeight: fontWeight.semibold,  // 600
    letterSpacing: -0.2,
  },
  labelSize_sm: {
    fontSize: fontSize.sm,            // 13
    lineHeight: 18,
  },
  labelSize_md: {
    fontSize: fontSize.base,          // 17 — spec uses F.sizes.base for md
    lineHeight: 24,
  },
  labelSize_lg: {
    fontSize: fontSize.base,          // 17 — same as md, taller button = more padding
    lineHeight: 24,
  },
});
