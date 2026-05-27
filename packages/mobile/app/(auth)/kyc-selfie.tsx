/**
 * KYC Selfie screen — step 3 of 3.
 * Opens the system front camera via expo-image-picker.
 * Calls POST /users/me/kyc/selfie and refreshes the user profile on submit.
 */

import * as React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  NavHeader, ProgressBar, Button, Banner,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { useUserContext } from '@/store/user-context';
import { useAuth } from '@/store/auth.store';
import { usersApi } from '@/api/users';
import { ApiError } from '@/api/client';

const CIRCLE_SIZE = 260;

export default function KycSelfieScreen(): React.ReactElement {
  const { setKycSubmitted } = useUserContext();
  const { setUser } = useAuth();
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);

  const handleOpenCamera = async (): Promise<void> => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setPermissionDenied(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!imageUri) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await usersApi.verifySelfie(imageUri);
      // Refresh user in auth store so profile reflects new kycStatus
      const updated = await usersApi.getMe();
      setUser(updated);
      setKycSubmitted();
      router.replace('/(auth)/kyc-submitted');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Permission denied ────────────────────────────────────────────────────
  if (permissionDenied) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <NavHeader title="Take Selfie" onBack={() => router.back()} />
        <View style={styles.content}>
          <ProgressBar step={3} total={3} />
          <Banner variant="warning">
            Camera access is required. Please enable it in your device Settings.
          </Banner>
          <Button variant="primary" fullWidth onPress={() => void handleOpenCamera()}>
            Try Again
          </Button>
          <Button variant="secondary" fullWidth onPress={() => router.replace('/(tabs)')}>
            I'll do this later
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Confirm captured photo ───────────────────────────────────────────────
  if (imageUri) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <NavHeader title="Confirm Selfie" onBack={() => !isSubmitting && setImageUri(null)} />
        <View style={styles.content}>
          <ProgressBar step={3} total={3} />

          <View style={styles.previewCircle}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          </View>

          <Text style={styles.title}>Looks good?</Text>
          <Text style={styles.subtitle}>
            Make sure your face is clearly visible and well-lit.
          </Text>

          {error && <Banner variant="danger">{error}</Banner>}

          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              loading={isSubmitting}
              onPress={() => void handleSubmit()}
            >
              Submit KYC
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={isSubmitting}
              onPress={() => setImageUri(null)}
            >
              Retake
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Take selfie ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavHeader title="Take Selfie" onBack={() => router.back()} />
      <View style={styles.content}>
        <ProgressBar step={3} total={3} />

        <Banner variant="info">
          Step 3 of 3 — Take a clear selfie to match your identity document.
        </Banner>

        <View style={styles.guideCircle}>
          <Text style={styles.faceEmoji}>🧑</Text>
          <Text style={styles.guideText}>Position your face here</Text>
        </View>

        <View style={styles.tips}>
          {[
            '📸  Look directly at the camera',
            '💡  Make sure lighting is even',
            '🚫  No sunglasses or face coverings',
          ].map((tip) => (
            <Text key={tip} style={styles.tip}>{tip}</Text>
          ))}
        </View>

        <View style={styles.actions}>
          <Button variant="primary" fullWidth onPress={() => void handleOpenCamera()}>
            Open Camera
          </Button>
          <Button variant="secondary" fullWidth onPress={() => router.replace('/(tabs)')}>
            I'll do this later
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.base, gap: spacing.md },
  guideCircle: {
    width:           CIRCLE_SIZE,
    height:          CIRCLE_SIZE,
    borderRadius:    CIRCLE_SIZE / 2,
    borderWidth:     3,
    borderColor:     colors.primary,
    borderStyle:     'dashed',
    alignSelf:       'center',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.primaryLight,
    marginVertical:  spacing.sm,
    gap:             spacing.xs,
  },
  faceEmoji:  { fontSize: 72 },
  guideText:  { fontSize: fontSize.sm, color: colors.textSec, textAlign: 'center' },
  tips:       { gap: spacing.xs },
  tip: {
    fontSize:   fontSize.sm,
    color:      colors.textSec,
    textAlign:  'center',
    lineHeight: 22,
  },
  actions:    { gap: spacing.sm, marginTop: 'auto' },
  previewCircle: {
    width:          CIRCLE_SIZE,
    height:         CIRCLE_SIZE,
    borderRadius:   CIRCLE_SIZE / 2,
    overflow:       'hidden',
    alignSelf:      'center',
    borderWidth:    3,
    borderColor:    colors.primary,
    marginVertical: spacing.sm,
  },
  previewImage: { width: CIRCLE_SIZE, height: CIRCLE_SIZE },
  title: {
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.bold,
    color:      colors.text,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:  fontSize.base,
    color:     colors.textSec,
    textAlign: 'center',
    lineHeight: 22,
  },
});
