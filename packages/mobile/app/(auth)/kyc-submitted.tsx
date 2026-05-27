/**
 * KYC Submitted screen — final step.
 * No back arrow (the user can't un-submit).
 * Shows confirmation and navigates to the main app.
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Button, Banner,
  colors, spacing, fontSize, fontWeight, borderRadius,
} from '@trustnest/ui-kit';
import { useUserContext } from '@/store/user-context';

const NEXT_STEPS = [
  'Our team will review your documents within 30 minutes.',
  'You\'ll receive a notification once your KYC is approved.',
  'After approval you can create and confirm rental agreements.',
];

export default function KycSubmittedScreen(): React.ReactElement {
  const { data } = useUserContext();
  const submittedAt = data.kycSubmittedAt
    ? new Date(data.kycSubmittedAt).toLocaleTimeString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* No NavHeader — no back arrow allowed */}
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroEmoji}>🎉</Text>
          </View>
          <Text style={styles.title}>Documents Submitted!</Text>
          <Text style={styles.subtitle}>
            {`Your ${data.kycIdType === 'pan' ? 'PAN card' : 'Aadhaar card'} and selfie have been uploaded successfully.`}
            {submittedAt ? ` Submitted at ${submittedAt}.` : ''}
          </Text>
        </View>

        {/* Status banner */}
        <Banner variant="success">
          KYC under review. You can continue using TrustNest while we verify your documents.
        </Banner>

        {/* What happens next */}
        <View style={styles.nextCard}>
          <Text style={styles.nextHeading}>What happens next</Text>
          {NEXT_STEPS.map((step, idx) => (
            <View key={idx} style={styles.nextRow}>
              <View style={styles.nextBullet}>
                <Text style={styles.nextNum}>{idx + 1}</Text>
              </View>
              <Text style={styles.nextText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <Button
          variant="primary"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        >
          Go to Dashboard
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  content: {
    flex:    1,
    padding: spacing.base,
    gap:     spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  hero: {
    alignItems:    'center',
    paddingTop:    spacing.xl,
    gap:           spacing.md,
  },
  heroCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: colors.successLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     colors.successBorder,
  },
  heroEmoji: { fontSize: 52 },
  title: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      colors.text,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:   fontSize.base,
    color:      colors.textSec,
    textAlign:  'center',
    lineHeight: 22,
  },
  nextCard: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.base,
    gap:             spacing.md,
  },
  nextHeading: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  nextRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  nextBullet: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: colors.successLight,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    marginTop:       1,
  },
  nextNum: {
    fontSize:   fontSize.xs,
    fontWeight: fontWeight.bold,
    color:      colors.successDark,
  },
  nextText: {
    flex:       1,
    fontSize:   fontSize.sm,
    color:      colors.text,
    lineHeight: 20,
  },
  spacer: { flex: 1 },
});
