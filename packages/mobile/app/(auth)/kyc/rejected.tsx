import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@trustnest/ui-kit';

/**
 * KYC Rejected screen — shown when verification has been rejected.
 * Accepts `reason` and `method` as route params.
 */
export default function KycRejectedScreen(): React.ReactElement {
  const { reason, method } = useLocalSearchParams<{ reason?: string; method?: string }>();

  const rejectionReason = reason ?? 'Your identity verification was not successful.';

  const handleRetrySelfie = (): void => {
    router.replace('/(auth)/kyc/selfie');
  };

  const handleSwitchMethod = (): void => {
    router.replace('/(auth)/kyc');
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verification Failed</Text>

      {/* Rejection reason banner */}
      <View style={styles.rejectionBanner}>
        <Text style={styles.rejectionIcon}>❌</Text>
        <View style={styles.rejectionContent}>
          <Text style={styles.rejectionTitle}>Verification Unsuccessful</Text>
          <Text style={styles.rejectionReason}>{rejectionReason}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>What would you like to do?</Text>

      <TouchableOpacity style={styles.optionCard} onPress={handleRetrySelfie} activeOpacity={0.7}>
        <View style={styles.optionIcon}>
          <Text style={styles.optionIconText}>🤳</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Retry Selfie</Text>
          <Text style={styles.optionDescription}>
            Take another selfie in better lighting conditions
          </Text>
        </View>
        <Text style={styles.optionArrow}>›</Text>
      </TouchableOpacity>

      {method !== 'aadhaar' ? (
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.replace('/(auth)/kyc/aadhaar')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>🪪</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Try Aadhaar Verification</Text>
            <Text style={styles.optionDescription}>
              Verify instantly with your Aadhaar-linked mobile OTP
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      ) : null}

      {method !== 'pan' ? (
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.replace('/(auth)/kyc/pan')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>📄</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Try PAN Verification</Text>
            <Text style={styles.optionDescription}>
              Verify with your PAN card (up to 24 hours review)
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      ) : null}

      <Button
        variant="secondary"
        fullWidth
        onPress={handleSwitchMethod}
        style={styles.button}
      >Choose Different Method</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 16,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
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
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  rejectionIcon: {
    fontSize: 24,
  },
  rejectionContent: {
    flex: 1,
    gap: 4,
  },
  rejectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  rejectionReason: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  optionArrow: {
    fontSize: 22,
    color: '#9CA3AF',
  },
  button: {
    marginTop: 8,
  },
});
