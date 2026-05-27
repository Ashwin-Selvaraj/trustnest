/**
 * KYC Intro screen — explains what KYC is and why it's needed.
 *
 * Guards:
 *  - kycStatus === VERIFIED  → redirect to tabs (already done)
 *  - kycStatus === PENDING && kycMethod set → show "in progress" state (submitted, awaiting review)
 *  - otherwise               → show normal intro + start flow
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  NavHeader, Banner, Button,
  colors, spacing, fontSize, fontWeight, borderRadius,
} from '@trustnest/ui-kit';
import { KycStatus } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';

const STEPS = [
  { emoji: '🪪', title: 'Document',  desc: 'Upload your Aadhaar card or PAN card.' },
  { emoji: '📷', title: 'Selfie',    desc: 'Take a live selfie to match your document.' },
  { emoji: '✅', title: 'Verified',  desc: 'Typically reviewed within 30 minutes.' },
];

export default function KycIntroScreen(): React.ReactElement {
  const { state } = useAuth();
  const user = state.user;

  const kycStatus = user?.kycStatus ?? KycStatus.PENDING;
  const kycMethod = user?.kycMethod ?? null;

  // Redirect verified users to home — must be at top-level (Rules of Hooks)
  React.useEffect(() => {
    if (kycStatus === KycStatus.VERIFIED) {
      router.replace('/(tabs)');
    }
  }, [kycStatus]);

  // Render nothing while the redirect fires
  if (kycStatus === KycStatus.VERIFIED) {
    return <SafeAreaView style={styles.safe} />;
  }

  // ─── Submitted but awaiting review ────────────────────────────────────────
  if (kycStatus === KycStatus.PENDING && kycMethod !== null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <NavHeader title="Identity Verification" onBack={() => router.replace('/(tabs)')} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🕐</Text>
            <Text style={styles.heroTitle}>Verification in Progress</Text>
            <Text style={styles.heroSubtitle}>
              Your documents have been submitted and are under review.
              This typically takes up to 30 minutes.
            </Text>
          </View>

          <Banner variant="info">
            We'll notify you once your identity has been verified. You can continue
            exploring the app in the meantime.
          </Banner>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsHeading}>What happens next</Text>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, styles.stepDone]}>
                <Text style={[styles.stepNum, styles.stepNumDone]}>✓</Text>
              </View>
              <View style={styles.stepRight}>
                <Text style={styles.stepTitle}>📋  Documents submitted</Text>
                <Text style={styles.stepDesc}>Your ID document has been uploaded.</Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, styles.stepDone]}>
                <Text style={[styles.stepNum, styles.stepNumDone]}>✓</Text>
              </View>
              <View style={styles.stepRight}>
                <Text style={styles.stepTitle}>🤳  Selfie captured</Text>
                <Text style={styles.stepDesc}>Your live selfie has been submitted.</Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>3</Text>
              </View>
              <View style={styles.stepRight}>
                <Text style={styles.stepTitle}>⏳  Under review</Text>
                <Text style={styles.stepDesc}>Our team is verifying your identity.</Text>
              </View>
            </View>
          </View>

          <Button
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/(tabs)')}
          >
            Back to Home
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Rejected — show reason + retry option ────────────────────────────────
  if (kycStatus === KycStatus.REJECTED) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <NavHeader title="Identity Verification" onBack={() => router.replace('/(tabs)')} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>❌</Text>
            <Text style={styles.heroTitle}>Verification Failed</Text>
            <Text style={styles.heroSubtitle}>
              Unfortunately your KYC submission was not approved.
              Please review the reason below and try again.
            </Text>
          </View>

          {user?.kycRejectionReason ? (
            <Banner variant="danger">
              {user.kycRejectionReason}
            </Banner>
          ) : (
            <Banner variant="danger">
              Your KYC was rejected. Please ensure your documents are valid and your
              selfie clearly shows your face.
            </Banner>
          )}

          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onPress={() => router.push('/(auth)/kyc-document')}
            >
              Retry Verification
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onPress={() => router.replace('/(tabs)')}
            >
              I'll do this later
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Default: not started ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavHeader title="Identity Verification" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🔒</Text>
          <Text style={styles.heroTitle}>Verify Your Identity</Text>
          <Text style={styles.heroSubtitle}>
            KYC lets both landlords and tenants trust each other.
            It takes less than 2 minutes.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsHeading}>How it works</Text>
          {STEPS.map((step, idx) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{idx + 1}</Text>
              </View>
              <View style={styles.stepRight}>
                <Text style={styles.stepTitle}>{step.emoji}  {step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info banner */}
        <Banner variant="info">
          Your documents are encrypted and never shared without your consent.
          We only store the last 4 digits of your Aadhaar number.
        </Banner>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push('/(auth)/kyc-document')}
          >
            Start Verification
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onPress={() => router.replace('/(tabs)')}
          >
            I'll do this later
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.lg },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: {
    fontSize:   fontSize.xxl,
    fontWeight: fontWeight.bold,
    color:      colors.text,
    textAlign:  'center',
  },
  heroSubtitle: {
    fontSize:   fontSize.base,
    color:      colors.textSec,
    lineHeight: 22,
    textAlign:  'center',
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.base,
    gap:             spacing.md,
  },
  stepsHeading: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.md,
  },
  stepBadge: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  stepDone: {
    backgroundColor: colors.successLight ?? '#d1fae5',
  },
  stepNum: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.bold,
    color:      colors.primary,
  },
  stepNumDone: {
    color: colors.success ?? '#10b981',
  },
  stepRight: { flex: 1, gap: 2 },
  stepTitle: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
  },
  stepDesc: {
    fontSize:   fontSize.sm,
    color:      colors.textSec,
    lineHeight: 20,
  },
  actions: { gap: spacing.sm },
});
