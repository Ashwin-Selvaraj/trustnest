/**
 * Toast — non-blocking transient feedback, slides up from the bottom.
 *
 * Design rules (production feedback hierarchy):
 *   success/info that needs no action  → Toast (auto-dismisses)
 *   contextual state on a screen       → Banner (persistent, inline)
 *   destructive confirmation           → Alert (blocking, deliberate)
 *
 * Presentation-only: state lives in the app's ToastProvider so the ui-kit
 * stays free of app-level context (dependency rule: ui-kit → shared only).
 *
 * @example
 * ```tsx
 * <Toast visible message="Interest sent to owner" variant="success" onHide={...} />
 * ```
 */

import * as React from 'react';
import { Animated, Easing, Text, StyleSheet, View } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadow } from '../theme';

export type ToastVariant = 'success' | 'info' | 'danger';

export interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  /** Auto-hide delay in ms. Default 2400. */
  duration?: number;
  /** Called after the hide animation completes. */
  onHide: () => void;
  /** Distance from the bottom edge (clears tab bars / CTAs). Default 96. */
  bottom?: number;
}

const VARIANT_META: Record<ToastVariant, { icon: string; accent: string }> = {
  success: { icon: '✓', accent: colors.success },
  info:    { icon: 'ℹ', accent: colors.primary },
  danger:  { icon: '✕', accent: colors.danger },
};

export function Toast({
  visible,
  message,
  variant = 'success',
  duration = 2400,
  onHide,
  bottom = 96,
}: ToastProps): React.ReactElement | null {
  const translateY = React.useRef(new Animated.Value(24)).current;
  const opacity    = React.useRef(new Animated.Value(0)).current;
  const hideTimer  = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 24,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, duration);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, duration, translateY, opacity, onHide]);

  if (!visible) return null;

  const meta = VARIANT_META[variant];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom, opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.toast}>
        <View style={[styles.iconDot, { backgroundColor: meta.accent }]}>
          <Text style={styles.iconText}>{meta.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.text, // dark surface — reads above any screen
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    maxWidth: 480,
    ...shadow.sheet,
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  message: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
});
