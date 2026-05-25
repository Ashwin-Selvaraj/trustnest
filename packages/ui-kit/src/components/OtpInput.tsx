import * as React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface OtpInputProps {
  /** Number of digits. Defaults to 6. */
  length?: number;
  /** Current OTP value string (controlled). */
  value: string;
  /** Called whenever the OTP string changes. */
  onChangeValue: (value: string) => void;
  /** Called when all digits are filled. */
  onComplete?: (value: string) => void;
  /** Whether to show an error border on all cells. */
  hasError?: boolean;
  /** Override outer container style. */
  style?: StyleProp<ViewStyle>;
}

/**
 * 6-digit (configurable) OTP input that auto-advances focus to the next cell
 * on each character entry and steps back on Backspace.
 *
 * @example
 * ```tsx
 * <OtpInput
 *   value={otp}
 *   onChangeValue={setOtp}
 *   onComplete={handleVerify}
 *   hasError={!!otpError}
 * />
 * ```
 */
export function OtpInput({
  length = 6,
  value,
  onChangeValue,
  onComplete,
  hasError = false,
  style,
}: OtpInputProps): React.ReactElement {
  const refs = React.useRef<(TextInput | null)[]>([]);
  const digits = value.split('').slice(0, length);

  const handleChangeText = (index: number, text: string): void => {
    // Take only the last character entered (handles paste by taking first `length` chars)
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned && text.length > 0) return; // reject non-digits

    if (cleaned.length > 1) {
      // Pasted a multi-char string — fill from this cell forward
      const pasted = cleaned.slice(0, length - index);
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[index + i] = pasted[i]!;
      }
      const newValue = newDigits.join('').slice(0, length);
      onChangeValue(newValue);
      const nextIndex = Math.min(index + pasted.length, length - 1);
      refs.current[nextIndex]?.focus();
      if (newValue.length === length) onComplete?.(newValue);
      return;
    }

    const newDigits = [...digits];
    if (cleaned) {
      newDigits[index] = cleaned;
    } else {
      delete newDigits[index];
    }
    const newValue = newDigits.join('').slice(0, length);
    onChangeValue(newValue);

    if (cleaned && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    if (newValue.length === length) onComplete?.(newValue);
  };

  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current cell already empty — move focus back and clear previous
        const newDigits = [...digits];
        delete newDigits[index - 1];
        onChangeValue(newDigits.join(''));
        refs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = !!digits[index];
        return (
          <TextInput
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            style={[
              styles.cell,
              isFilled && styles.cellFilled,
              hasError && styles.cellError,
            ]}
            value={digits[index] ?? ''}
            onChangeText={(text) => handleChangeText(index, text)}
            onKeyPress={(e) => handleKeyPress(index, e)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            caretHidden
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightBold,
    color: colors.text,
    backgroundColor: colors.white,
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cellError: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveLight,
  },
});
