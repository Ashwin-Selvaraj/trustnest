import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@trustnest/ui-kit';
import { usersApi } from '@/api/users';
import { ApiError } from '@/api/client';

type VerifyState = 'idle' | 'verifying' | 'success' | 'failure';

/**
 * Selfie / liveness check screen.
 * In Phase 1 this is a stub — the backend auto-verifies.
 * Production: integrate camera + liveness SDK.
 */
export default function SelfieKycScreen(): React.ReactElement {
  const [verifyState, setVerifyState] = React.useState<VerifyState>('idle');
  const [failureReason, setFailureReason] = React.useState<string | null>(null);

  const handleTakePhoto = async (): Promise<void> => {
    setVerifyState('verifying');
    try {
      // In production: capture photo via expo-camera, upload to backend
      // For Phase 1 stub, backend auto-verifies
      const result = await usersApi.verifySelfie();
      if (result.success) {
        setVerifyState('success');
      } else {
        setVerifyState('failure');
        setFailureReason('Liveness check failed. Please try again in good lighting.');
      }
    } catch (err: unknown) {
      setVerifyState('failure');
      setFailureReason(
        err instanceof ApiError ? err.message : 'Verification failed. Please try again.',
      );
    }
  };

  const handleDone = (): void => {
    router.replace('/(tabs)');
  };

  const handleRetry = (): void => {
    setVerifyState('idle');
    setFailureReason(null);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => (verifyState === 'idle' ? router.back() : handleRetry())}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Selfie Check</Text>
      <Text style={styles.subtitle}>
        Take a quick selfie to confirm your identity. Make sure your face is clearly visible.
      </Text>

      {/* Camera placeholder with oval face guide */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPlaceholder}>
          <View style={styles.faceGuide} />
          {verifyState === 'verifying' ? (
            <View style={styles.verifyingOverlay}>
              <Text style={styles.verifyingText}>Verifying...</Text>
            </View>
          ) : verifyState === 'success' ? (
            <View style={styles.successOverlay}>
              <Text style={styles.successIcon}>✅</Text>
            </View>
          ) : verifyState === 'failure' ? (
            <View style={styles.failureOverlay}>
              <Text style={styles.failureIcon}>❌</Text>
            </View>
          ) : (
            <Text style={styles.cameraHint}>Position your face in the oval</Text>
          )}
        </View>
      </View>

      {/* Status banners */}
      {verifyState === 'success' ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerIcon}>✅</Text>
          <Text style={styles.successBannerText}>Identity Verified!</Text>
        </View>
      ) : null}

      {verifyState === 'failure' && failureReason ? (
        <View style={styles.failureBanner}>
          <Text style={styles.failureBannerText}>{failureReason}</Text>
        </View>
      ) : null}

      {/* Tips */}
      {verifyState === 'idle' ? (
        <View style={styles.tipsList}>
          {['Good lighting on your face', 'Remove glasses if possible', 'Look directly at the camera'].map(
            (tip) => (
              <View key={tip} style={styles.tipRow}>
                <Text style={styles.tipDot}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ),
          )}
        </View>
      ) : null}

      {/* Action buttons */}
      {verifyState === 'success' ? (
        <Button
          variant="primary"
          fullWidth
          onPress={handleDone}
          style={styles.button}
        >Done</Button>
      ) : verifyState === 'failure' ? (
        <Button
          variant="primary"
          fullWidth
          onPress={handleRetry}
          style={styles.button}
        >Try Again</Button>
      ) : (
        <Button
          variant="primary"
          fullWidth
          loading={verifyState === 'verifying'}
          disabled={verifyState === 'verifying'}
          onPress={() => void handleTakePhoto()}
          style={styles.button}
        >Take Photo</Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 4,
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  backText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  cameraContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  cameraPlaceholder: {
    width: 280,
    height: 360,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceGuide: {
    position: 'absolute',
    width: 180,
    height: 230,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  cameraHint: {
    position: 'absolute',
    bottom: 24,
    fontSize: 13,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  verifyingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(22,163,74,0.7)',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 60,
  },
  failureOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(220,38,38,0.7)',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failureIcon: {
    fontSize: 60,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  successBannerIcon: {
    fontSize: 20,
  },
  successBannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  failureBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    marginBottom: 16,
  },
  failureBannerText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsList: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
    width: '100%',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipDot: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
});
