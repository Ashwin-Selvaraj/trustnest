/**
 * FilterBar — horizontal scrollable filter chip row.
 */

import * as React from 'react';
import {
  ScrollView, TouchableOpacity, Text, StyleSheet, View,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterItem {
  key: string;
  label: string;
}

export interface FilterBarProps {
  filters: FilterItem[];
  selected: string[];
  onFilterChange: (selected: string[]) => void;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterBar({
  filters,
  selected,
  onFilterChange,
  style,
}: FilterBarProps): React.ReactElement {
  const toggle = React.useCallback(
    (key: string) => {
      if (selected.includes(key)) {
        onFilterChange(selected.filter(k => k !== key));
      } else {
        onFilterChange([...selected, key]);
      }
    },
    [selected, onFilterChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {filters.map((filter) => {
        const isSelected = selected.includes(filter.key);
        return (
          <TouchableOpacity
            key={filter.key}
            onPress={() => toggle(filter.key)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipDefault,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelDefault,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    paddingHorizontal: spacing.base,
    gap:            spacing.sm,
    alignItems:     'center',
  },
  chip: {
    paddingVertical:   8,
    paddingHorizontal: 14,
    borderRadius:      borderRadius.full,
    borderWidth:       1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  chipDefault: {
    backgroundColor: colors.surface,
    borderColor:     colors.border,
  },
  label: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelDefault: {
    color: colors.text,
  },
});
