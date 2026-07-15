import * as React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import { Button, colors, spacing, fontSize, fontWeight, borderRadius } from '@trustnest/ui-kit';

export interface FilterSection {
  key: string;
  label: string;
  options: { key: string; label: string }[];
}

interface FiltersSheetProps {
  visible: boolean;
  sections: FilterSection[];
  /** section key → selected option keys */
  selected: Record<string, string[]>;
  resultCount: number;
  onChange: (sectionKey: string, values: string[]) => void;
  onClear: () => void;
  onApply: () => void;
  onDismiss: () => void;
}

/**
 * Filters bottom sheet — single entry point for all Browse filters.
 * Replaces always-visible stacked chip rows: filters are opqut-in UI,
 * not permanent screen real estate, matching standard marketplace apps
 * (Airbnb / Zillow / 99acres "Filters" pattern).
 */
export function FiltersSheet({
  visible, sections, selected, resultCount, onChange, onClear, onApply, onDismiss,
}: FiltersSheetProps): React.ReactElement {
  const toggle = (sectionKey: string, optionKey: string): void => {
    const current = selected[sectionKey] ?? [];
    const next = current.includes(optionKey)
      ? current.filter(k => k !== optionKey)
      : [...current, optionKey];
    onChange(sectionKey, next);
  };

  const totalSelected = Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          {totalSelected > 0 && (
            <TouchableOpacity onPress={onClear} hitSlop={8}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <View style={styles.chipGrid}>
                {section.options.map((opt) => {
                  const isSelected = (selected[section.key] ?? []).includes(opt.key);
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => toggle(section.key, opt.key)}
                      activeOpacity={0.75}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <Button variant="primary" fullWidth onPress={onApply} style={styles.applyButton}>
          {resultCount === 1 ? 'Show 1 property' : `Show ${resultCount} properties`}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  clearText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  body: { maxHeight: 420 },
  section: { gap: spacing.sm, marginBottom: spacing.md },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  chipTextSelected: { color: '#FFFFFF' },
  applyButton: { marginTop: spacing.xs },
});
