/**
 * TextInput — labelled field with error / hint states and optional prefix.
 *
 * Props API mirrors design-reference/primitives.jsx TextInput exactly
 * (with `onChangeText` in place of `onChange`, and `numberOfLines` for rows).
 *
 * @example
 * ```tsx
 * <TextInput label="Full name" value={name} onChangeText={setName} />
 * <TextInput label="Monthly Rent" prefix="₹" keyboardType="numeric"
 *            value={rent} onChangeText={setRent} error={errors.rent} />
 * <TextInput label="Description" multiline numberOfLines={4}
 *            value={desc} onChangeText={setDesc} />
 * ```
 */

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
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /** Label shown above the input. */
  label?: string;
  /** Error message shown below in red. Hides `hint` when set. */
  error?: string;
  /** Helper text shown below the input. */
  hint?: string;
  /**
   * Prefix shown inside the left edge of the field.
   * Pass `"₹"` for INR amount fields, `"+91"` for phone fields, etc.
   * (Renamed from `currencyPrefix` to match the design spec's `prefix` prop.)
   */
  prefix?: string;
  /** Override the outer wrapper style. */
  style?: StyleProp<ViewStyle>;
  /** Override the inner RNTextInput style. */
  inputStyle?: StyleProp<TextStyle>;

  // ── Legacy alias ────────────────────────────────────────────────────────────
  /** @deprecated Use `prefix` instead. Will be removed in a future release. */
  currencyPrefix?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TextInput({
  label,
  error,
  hint,
  prefix,
  currencyPrefix,   // legacy alias
  style,
  inputStyle,
  editable = true,
  multiline = false,
  ...rest
}: TextInputProps): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  const effectivePrefix = prefix ?? currencyPrefix;

  // Border colour: error > focused > default
  const borderColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.borderStrong;  // #D1D5DB — spec uses borderStrong for default border

  // Focus ring shadow (spec: box-shadow 0 0 0 3px rgba(37,99,235,0.12))
  const focusShadow = focused
    ? {
        shadowColor:   error ? colors.danger : colors.primary,
        shadowOffset:  { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius:  3,
        elevation:     0,
      }
    : undefined;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          { borderColor },
          !editable && styles.disabled,
          focusShadow,
        ]}
      >
        {effectivePrefix ? (
          <Text
            style={[
              styles.prefix,
              multiline && styles.prefixMultiline,
            ]}
          >
            {effectivePrefix}
          </Text>
        ) : null}

        <RNTextInput
          style={[
            styles.input,
            effectivePrefix && styles.inputWithPrefix,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          placeholderTextColor={colors.textDis}
          editable={editable}
          multiline={multiline}
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

// ─── INR helpers (re-exported from same module for convenience) ───────────────

/** `'1234567'` → `'12,34,567'`  (Indian comma format, no ₹ symbol) */
export function formatINR(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const last3 = digits.slice(-3);
  const rest  = digits.slice(0, -3);
  if (!rest) return last3;
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

/** `'12,34,567'` → `'1234567'` */
export function parseINR(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,           // 13 — spec: F.sizes.sm
    fontWeight: fontWeight.medium,
    color: colors.text,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,   // 12
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: colors.surface,
  },
  prefix: {
    paddingLeft: 14,
    paddingRight: 4,
    fontSize: fontSize.base,         // 17 — spec: F.sizes.base
    fontWeight: fontWeight.medium,
    color: colors.textSec,
    alignSelf: 'center',
  },
  prefixMultiline: {
    alignSelf: 'flex-start',
    paddingTop: 14,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,         // 17 — spec: F.sizes.base
    color: colors.text,
    letterSpacing: -0.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    lineHeight: 22,
  },
  inputWithPrefix: {
    paddingLeft: 4,                  // prefix supplies its own left padding
  },
  inputMultiline: {
    minHeight: 88,                   // ~4 rows at 22px line-height
    textAlignVertical: 'top',        // Android: start text at top
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textSec,
  },
});
