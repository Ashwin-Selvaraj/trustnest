/**
 * OtpInput — N-digit controlled OTP entry that auto-advances on each digit
 * and steps back on Backspace.  Supports paste.
 * Matches design-reference/primitives.jsx OtpInput exactly.
 *
 * @example
 * ```tsx
 * <OtpInput
 *   value={otp}
 *   onChange={setOtp}
 *   onComplete={handleVerify}
 *   error={!!otpError}
 * />
 * ```
 */

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
import { colors, borderRadius } from '../theme';

export interface OtpInputProps {
  /** Number of digit cells. Default `6`. */
  length?:     number;
  /** Current OTP string (controlled). */
  value:       string;
  /** Called on every change with the updated OTP string. */
  onChange:    (value: string) => void;
  /** Called when all digits are filled. */
  onComplete?: (value: string) => void;
  /** Show an error border + background on all cells. */
  error?:      boolean;
  /** Focus the first cell on mount. */
  autoFocus?:  boolean;
  style?:      StyleProp<ViewStyle>;

  // ── Backward-compat aliases ──────────────────────────────────────────────
  /** @deprecated Use `onChange`. */
  onChangeValue?: (value: string) => void;
  /** @deprecated Use `error`. */
  hasError?:      boolean;
}

export function OtpInput({
  length        = 6,
  value,
  onChange,
  onComplete,
  error         = false,
  autoFocus     = false,
  style,
  // deprecated aliases
  onChangeValue,
  hasError,
}: OtpInputProps): React.ReactElement {
  // Resolve deprecated aliases
  const isError   = error || hasError || false;
  const handleChange = onChange ?? onChangeValue ?? (() => {});

  const refs   = React.useRef<(TextInput | null)[]>([]);
  const digits = value.split('').slice(0, length);

  const commit = (next: string): void => {
    handleChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChangeText = (index: number, text: string): void => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned && text.length > 0) return;

    if (cleaned.length > 1) {
      // Paste — fill from this cell forward
      const pasted    = cleaned.slice(0, length - index);
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[index + i] = pasted[i]!;
      }
      const next = newDigits.join('').slice(0, length);
      commit(next);
      refs.current[Math.min(index + pasted.length, length - 1)]?.focus();
      return;
    }

    const newDigits = [...digits];
    if (cleaned) {
      newDigits[index] = cleaned;
    } else {
      delete newDigits[index];
    }
    const next = newDigits.join('').slice(0, length);
    commit(next);
    if (cleaned && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ): void => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      delete newDigits[index - 1];
      commit(newDigits.join(''));
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = !!digits[index];
        return (
          <TextInput
            key={index}
            ref={(el) => { refs.current[index] = el; }}
            style={[
              styles.cell,
              isFilled && !isError ? styles.cellFilled : null,
              isError             ? styles.cellError  : null,
            ]}
            value={digits[index] ?? ''}
            onChangeText={(t) => handleChangeText(index, t)}
            onKeyPress={(e) => handleKeyPress(index, e)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
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
    flexDirection:  'row',
    gap:            10,
    justifyContent: 'center',
  },
  cell: {
    width:           48,
    height:          56,
    borderWidth:     1.5,
    borderColor:     colors.borderStrong,   // unfilled: borderStrong (#D1D5DB)
    borderRadius:    borderRadius.md,       // 12
    textAlign:       'center',
    fontSize:        26,                    // spec: 26px (not a named scale token)
    fontWeight:      '600',
    color:           colors.text,
    backgroundColor: colors.white,
  },
  // Filled & no error: primary border + glow
  cellFilled: {
    borderColor:   colors.primary,
    // boxShadow equivalent: '0 0 0 3px rgba(37,99,235,0.10)'
    shadowColor:   '#2563EB',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius:  3,
    elevation:     1,
  },
  // Error: danger border + dangerLight bg
  cellError: {
    borderColor:     colors.danger,
    backgroundColor: colors.dangerLight,
    color:           colors.danger,
  },
});
