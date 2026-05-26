/**
 * SectionHeader — uppercase form / section label.
 * Matches design-reference/primitives.jsx SectionHeader exactly.
 *
 * @example
 * ```tsx
 * <SectionHeader>Personal Details</SectionHeader>
 * <SectionHeader>KYC Documents</SectionHeader>
 * ```
 */

import * as React from 'react';
import {
  Text,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { colors, fontSize, fontWeight } from '../theme';

export interface SectionHeaderProps {
  children: React.ReactNode;
  style?:   StyleProp<TextStyle>;
}

export function SectionHeader({
  children,
  style,
}: SectionHeaderProps): React.ReactElement {
  return (
    <Text style={[styles.header, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize:      fontSize.sm,       // 13
    fontWeight:    fontWeight.semibold,
    color:         colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  12,
    marginTop:     4,
  },
});
