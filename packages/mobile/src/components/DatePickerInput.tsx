/**
 * DatePickerInput — plain TextInput-based date entry (DD/MM/YYYY).
 *
 * Replaces the @react-native-community/datetimepicker native module so the
 * component works in the current dev build without a rebuild.
 * (Native date-picker will be restored in a future APK build.)
 *
 * Props are identical to the original — callers need no changes.
 */

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput as UiTextInput, colors, spacing } from '@trustnest/ui-kit';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Display a Date as DD/MM/YYYY */
function dateToDisplay(d: Date): string {
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Parse DD/MM/YYYY → Date, or null if invalid */
function parseDisplay(raw: string): Date | null {
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Guard against JS silently rolling over invalid dates (e.g. 31/02/2024)
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth()    !== Number(m) - 1 ||
    date.getDate()     !== Number(d)
  ) return null;
  return date;
}

function dateToYMD(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DatePickerInputProps {
  label:        string;
  value:        Date | null;
  onChange:     (date: Date, isoString: string) => void;
  hint?:        string;
  error?:       string;
  minimumDate?: Date;
  maximumDate?: Date;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DatePickerInput({
  label,
  value,
  onChange,
  hint,
  error,
  minimumDate,
  maximumDate,
}: DatePickerInputProps): React.ReactElement {
  const [text, setText] = React.useState<string>(value ? dateToDisplay(value) : '');
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Sync external value changes (e.g. form reset)
  React.useEffect(() => {
    if (value) setText(dateToDisplay(value));
  }, [value]);

  const handleChangeText = (raw: string): void => {
    // Re-derive the formatted value from the digits alone so slashes appear
    // no matter how the input arrives (fast typing, paste, autofill) and
    // disappear naturally on deletion: 2408 → 24/08, 24082026 → 24/08/2026.
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let v = digits;
    if (digits.length > 4)      v = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) v = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setText(v);
    setLocalError(null);
  };

  const handleBlur = (): void => {
    if (!text) {
      setLocalError(null);
      return;
    }
    const parsed = parseDisplay(text);
    if (!parsed) {
      setLocalError('Enter a valid date (DD/MM/YYYY)');
      return;
    }
    if (minimumDate && parsed < minimumDate) {
      setLocalError(`Date must be on or after ${dateToDisplay(minimumDate)}`);
      return;
    }
    if (maximumDate && parsed > maximumDate) {
      setLocalError(`Date must be on or before ${dateToDisplay(maximumDate)}`);
      return;
    }
    setLocalError(null);
    onChange(parsed, dateToYMD(parsed));
  };

  const displayError = error ?? localError ?? undefined;

  return (
    <View style={styles.wrapper}>
      <UiTextInput
        label={label}
        value={text}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        placeholder="📅  DD/MM/YYYY"
        keyboardType="numeric"
        maxLength={10}
        error={displayError}
        hint={!displayError ? (hint ?? 'Enter date as DD/MM/YYYY') : undefined}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
});
