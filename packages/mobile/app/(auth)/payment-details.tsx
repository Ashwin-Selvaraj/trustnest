import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@trustnest/ui-kit';
import { usersApi } from '@/api/users';
import { ApiError } from '@/api/client';

type Tab = 'upi' | 'bank';

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Payment Details screen — save UPI ID or bank account details.
 */
export default function PaymentDetailsScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<Tab>('upi');

  // UPI tab state
  const [upiId, setUpiId] = React.useState('');
  const [upiError, setUpiError] = React.useState<string | null>(null);

  // Bank tab state
  const [accountNumber, setAccountNumber] = React.useState('');
  const [ifsc, setIfsc] = React.useState('');
  const [ifscError, setIfscError] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpiChange = (text: string): void => {
    setUpiId(text);
    if (text.length > 0) {
      setUpiError(UPI_REGEX.test(text) ? null : 'Enter a valid UPI ID (e.g. name@upi)');
    } else {
      setUpiError(null);
    }
  };

  const handleIfscChange = (text: string): void => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setIfsc(cleaned);
    if (cleaned.length === 11) {
      setIfscError(IFSC_REGEX.test(cleaned) ? null : 'Invalid IFSC code format');
    } else {
      setIfscError(null);
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'upi') {
        if (!upiId || !UPI_REGEX.test(upiId)) {
          setUpiError('Enter a valid UPI ID');
          return;
        }
        await usersApi.savePaymentDetails({ upiId });
      } else {
        if (!accountNumber || accountNumber.length < 9) {
          setError('Enter a valid bank account number');
          return;
        }
        if (!ifsc || !IFSC_REGEX.test(ifsc)) {
          setIfscError('Enter a valid IFSC code');
          return;
        }
        await usersApi.savePaymentDetails({
          bankAccountNumber: accountNumber,
          bankIfsc: ifsc,
        });
      }
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to save payment details.');
    } finally {
      setIsLoading(false);
    }
  };

  const isSaveDisabled =
    activeTab === 'upi'
      ? !upiId || !!upiError
      : !accountNumber || accountNumber.length < 9 || !ifsc || !!ifscError;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Payment Details</Text>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>💳</Text>
          <Text style={styles.infoText}>
            Required to pay or receive rental deposits. Your details are encrypted and secure.
          </Text>
        </View>

        {/* Tab picker */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upi' && styles.tabActive]}
            onPress={() => setActiveTab('upi')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'upi' && styles.tabTextActive]}>
              UPI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bank' && styles.tabActive]}
            onPress={() => setActiveTab('bank')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'bank' && styles.tabTextActive]}>
              Bank Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Success banner */}
        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ Payment details saved successfully!</Text>
          </View>
        ) : null}

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* UPI tab */}
        {activeTab === 'upi' ? (
          <View style={styles.tabContent}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>UPI ID</Text>
              <TextInput
                style={[styles.input, upiError ? styles.inputError : undefined]}
                placeholder="e.g. yourname@upi"
                placeholderTextColor="#9CA3AF"
                value={upiId}
                onChangeText={handleUpiChange}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
              {upiError ? <Text style={styles.fieldError}>{upiError}</Text> : null}
            </View>
            <Text style={styles.hint}>
              UPI ID format: username@bankname (e.g. john@okicici)
            </Text>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor="#9CA3AF"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>IFSC Code</Text>
              <TextInput
                style={[styles.input, ifscError ? styles.inputError : undefined]}
                placeholder="e.g. SBIN0001234"
                placeholderTextColor="#9CA3AF"
                value={ifsc}
                onChangeText={handleIfscChange}
                autoCapitalize="characters"
                maxLength={11}
                returnKeyType="done"
              />
              {ifscError ? <Text style={styles.fieldError}>{ifscError}</Text> : null}
            </View>
            <Text style={styles.hint}>
              Bank account details will be verified via a penny drop (1 minute).
            </Text>
          </View>
        )}

        <Button
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isSaveDisabled || success}
          onPress={() => void handleSave()}
          style={styles.button}
        >
          {activeTab === 'bank' ? 'Verify & Save' : 'Save'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 4,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 20,
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
  tabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    gap: 4,
    marginBottom: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 8,
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16A34A',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
