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

type KycOption = 'aadhaar' | 'pan';

/**
 * KYC entry screen — user picks Aadhaar or PAN verification.
 */
export default function KycIndexScreen(): React.ReactElement {
  const [selected, setSelected] = React.useState<KycOption>('aadhaar');

  const handleContinue = (): void => {
    if (selected === 'aadhaar') {
      router.push('/(auth)/kyc/aadhaar');
    } else {
      router.push('/(auth)/kyc/pan');
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Verify Identity</Text>
        <Text style={styles.subtitle}>Choose a method to verify your identity</Text>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>🔒</Text>
        <Text style={styles.infoText}>
          Required to create or confirm a rental agreement. Your data is encrypted and never shared.
        </Text>
      </View>

      {/* Option cards */}
      <TouchableOpacity
        style={[styles.optionCard, selected === 'aadhaar' && styles.optionCardSelected]}
        onPress={() => setSelected('aadhaar')}
        activeOpacity={0.7}
      >
        <View style={styles.optionHeader}>
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>🪪</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, selected === 'aadhaar' && styles.optionTitleSelected]}>
              Aadhaar Card
            </Text>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          </View>
          <View style={[styles.radio, selected === 'aadhaar' && styles.radioSelected]}>
            {selected === 'aadhaar' ? <View style={styles.radioDot} /> : null}
          </View>
        </View>
        <Text style={styles.optionDescription}>
          Instant verification via OTP sent to your Aadhaar-linked mobile number.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, selected === 'pan' && styles.optionCardSelected]}
        onPress={() => setSelected('pan')}
        activeOpacity={0.7}
      >
        <View style={styles.optionHeader}>
          <View style={styles.optionIcon}>
            <Text style={styles.optionIconText}>📄</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, selected === 'pan' && styles.optionTitleSelected]}>
              PAN Card
            </Text>
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewText}>24hr review</Text>
            </View>
          </View>
          <View style={[styles.radio, selected === 'pan' && styles.radioSelected]}>
            {selected === 'pan' ? <View style={styles.radioDot} /> : null}
          </View>
        </View>
        <Text style={styles.optionDescription}>
          Verify using your PAN number. A manual review may take up to 24 hours.
        </Text>
      </TouchableOpacity>

      <Button
        variant="primary"
        fullWidth
        onPress={handleContinue}
        style={styles.button}
      >Continue</Button>
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
  header: {
    gap: 8,
    marginBottom: 8,
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
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1D4ED8',
    lineHeight: 20,
  },
  optionCard: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  optionCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIconText: {
    fontSize: 20,
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionTitleSelected: {
    color: '#1D4ED8',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  reviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  button: {
    marginTop: 8,
  },
});
