import * as React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /** Field label shown above the input. */
  label?: string;
  /** Error message shown below the input in red. */
  error?: string;
  /** Helper text shown below the input (hidden when `error` is set). */
  hint?: string;
  /** Prefixes the input with a currency symbol (e.g. "₹"). */
  currencyPrefix?: string;
  /** Override wrapper style. */
  style?: StyleProp<ViewStyle>;
  /** Override the inner TextInput style. */
  inputStyle?: StyleProp<TextStyle>;
}

/**
 * Labelled text input with error / hint states and optional INR currency prefix.
 *
 * Pass `keyboardType="numeric"` together with `currencyPrefix="₹"` for INR
 * amount fields.
 *
 * @example
 * ```tsx
 * <TextInput
 *   label="Security Deposit"
 *   currencyPrefix="₹"
 *   keyboardType="numeric"
 *   value={amount}
 *   onChangeText={setAmount}
 *   error={errors.amount}
 * />
 * ```
 */
export function TextInput({
  label,
  error,
  hint,
  currencyPrefix,
  style,
  inputStyle,
  editable = true,
  ...rest
}: TextInputProps): React.ReactElement {
  const [focused, setFocused] = React.useState(false);

  const inputContainerStyle: StyleProp<ViewStyle> = [
    styles.inputContainer,
    focused && styles.inputContainerFocused,
    !!error && styles.inputContainerError,
    !editable && styles.inputContainerDisabled,
  ];

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={inputContainerStyle}>
        {currencyPrefix ? (
          <Text style={styles.currencyPrefix}>{currencyPrefix}</Text>
        ) : null}
        <RNTextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.textDisabled}
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

/**
 * Formats a raw numeric string as an INR amount with commas.
 * `'1234567'` → `'12,34,567'`
 */
export function formatINR(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  if (!rest) return lastThree;
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
}

/**
 * Strips all non-digit characters from an INR-formatted string,
 * returning the raw integer string suitable for API calls.
 * `'12,34,567'` → `'1234567'`
 */
export function parseINR(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
    color: colors.text,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: colors.borderFocus,
  },
  inputContainerError: {
    borderColor: colors.destructive,
  },
  inputContainerDisabled: {
    backgroundColor: colors.surface,
  },
  currencyPrefix: {
    fontSize: typography.fontSizeBase,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSizeBase,
    color: colors.text,
    lineHeight: typography.lineHeightBase,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizeXs,
    color: colors.destructive,
    marginTop: 2,
  },
  hintText: {
    fontSize: typography.fontSizeXs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
