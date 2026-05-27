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
    // Auto-insert slashes as user types: 01 → 01/ → 01/03 → 01/03/
    let v = raw.replace(/[^\d/]/g, '');
    if (raw.length > text.length) {
      // Typing forward — auto-add slashes
      if (v.length === 2 && !v.includes('/'))  v = v + '/';
      if (v.length === 5 && v.split('/').length === 2) v = v + '/';
    }
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
