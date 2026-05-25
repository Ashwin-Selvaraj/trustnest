import * as React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button label text. */
  label: string;
  /** Visual variant. Defaults to `'primary'`. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to `'md'`. */
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction. */
  loading?: boolean;
  /** Full-width layout. */
  fullWidth?: boolean;
  /** Override container style. */
  style?: StyleProp<ViewStyle>;
  /** Override label style. */
  labelStyle?: StyleProp<TextStyle>;
}

/**
 * Pressable button with three visual variants (primary, secondary, destructive)
 * and three size presets.
 *
 * @example
 * ```tsx
 * <Button label="Pay Deposit" variant="primary" onPress={handlePay} />
 * <Button label="Cancel" variant="secondary" onPress={handleCancel} />
 * <Button label="Raise Dispute" variant="destructive" loading={isSubmitting} />
 * ```
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  labelStyle,
  ...rest
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    isDisabled && styles[`${variant}Disabled`],
    style,
  ];

  const textStyle: StyleProp<TextStyle> = [
    styles.label,
    styles[`${variant}Label`],
    styles[`sizeLabel_${size}`],
    isDisabled && styles.labelDisabled,
    labelStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? colors.primary : colors.white}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
  },
  // Disabled per variant
  disabled: {
    opacity: 0.5,
  },
  primaryDisabled: {},
  secondaryDisabled: {},
  destructiveDisabled: {},
  // Sizes
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
  },
  size_md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  // Labels
  label: {
    fontWeight: typography.fontWeightSemiBold,
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.text,
  },
  destructiveLabel: {
    color: colors.white,
  },
  labelDisabled: {},
  sizeLabel_sm: {
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightSm,
  },
  sizeLabel_md: {
    fontSize: typography.fontSizeBase,
    lineHeight: typography.lineHeightBase,
  },
  sizeLabel_lg: {
    fontSize: typography.fontSizeLg,
    lineHeight: typography.lineHeightLg,
  },
});
