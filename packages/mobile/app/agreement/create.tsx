import * as React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  NavHeader, SectionHeader, Button, TextInput, formatINR, parseINR,
  colors, spacing,
} from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { ApiError } from '@/api/client';

interface FormState {
  propertyAddress: string;
  rentINR:          string;
  depositINR:       string;
  startDate:        string;
  endDate:          string;
  counterpartyPhone: string;
}

interface FormErrors {
  propertyAddress?:  string;
  rentINR?:          string;
  depositINR?:       string;
  startDate?:        string;
  endDate?:          string;
  counterpartyPhone?: string;
}

export default function CreateAgreementScreen(): React.ReactElement {
  const [form, setForm] = React.useState<FormState>({
    propertyAddress:   '',
    rentINR:           '',
    depositINR:        '',
    startDate:         '',
    endDate:           '',
    counterpartyPhone: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const setField = (key: keyof FormState, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.propertyAddress.trim()) e.propertyAddress = 'Property address is required';
    const rent = parseInt(parseINR(form.rentINR), 10);
    if (!rent || rent < 1000) e.rentINR = 'Rent must be at least ₹1,000';
    const deposit = parseInt(parseINR(form.depositINR), 10);
    if (!deposit || deposit < 1000) e.depositINR = 'Deposit must be at least ₹1,000';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) e.startDate = 'Use format YYYY-MM-DD';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.endDate))   e.endDate   = 'Use format YYYY-MM-DD';
    if (form.endDate <= form.startDate)                e.endDate   = 'End date must be after start date';
    const phone = form.counterpartyPhone.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(phone)) e.counterpartyPhone = 'Enter a valid 10-digit number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const agreement = await agreementsApi.create({
        propertyAddress:   form.propertyAddress.trim(),
        rentINR:           parseInt(parseINR(form.rentINR), 10),
        depositINR:        parseInt(parseINR(form.depositINR), 10),
        startDate:         form.startDate,
        endDate:           form.endDate,
        counterpartyPhone: `+91${form.counterpartyPhone.replace(/\s/g, '')}`,
      });
      Alert.alert('Agreement Created', 'The counterparty will be notified to confirm.', [
        { text: 'View Agreement', onPress: () => router.replace(`/agreement/${agreement.id}`) },
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to create agreement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NavHeader title="New Agreement" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <SectionHeader>Property Details</SectionHeader>
        <TextInput
          label="Property Address"
          placeholder="12 MG Road, Bengaluru, Karnataka 560001"
          value={form.propertyAddress}
          onChangeText={(t) => setField('propertyAddress', t)}
          error={errors.propertyAddress}
          multiline
          numberOfLines={2}
        />

        <SectionHeader style={styles.sectionGap}>Financials</SectionHeader>
        <TextInput
          label="Monthly Rent"
          currencyPrefix="₹"
          keyboardType="numeric"
          placeholder="25,000"
          value={form.rentINR}
          onChangeText={(t) => setField('rentINR', formatINR(parseINR(t)))}
          error={errors.rentINR}
        />
        <TextInput
          label="Security Deposit"
          currencyPrefix="₹"
          keyboardType="numeric"
          placeholder="75,000"
          value={form.depositINR}
          onChangeText={(t) => setField('depositINR', formatINR(parseINR(t)))}
          error={errors.depositINR}
          hint="Typically 2–3 months' rent"
        />

        <SectionHeader style={styles.sectionGap}>Lease Period</SectionHeader>
        <TextInput
          label="Start Date"
          placeholder="2025-01-01"
          value={form.startDate}
          onChangeText={(t) => setField('startDate', t)}
          error={errors.startDate}
          hint="Format: YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
        <TextInput
          label="End Date"
          placeholder="2025-12-31"
          value={form.endDate}
          onChangeText={(t) => setField('endDate', t)}
          error={errors.endDate}
          hint="Format: YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />

        <SectionHeader style={styles.sectionGap}>Counterparty</SectionHeader>
        <TextInput
          label="Counterparty Phone"
          placeholder="98765 43210"
          keyboardType="phone-pad"
          value={form.counterpartyPhone}
          onChangeText={(t) => setField('counterpartyPhone', t)}
          error={errors.counterpartyPhone}
          hint="They will receive an SMS to join and confirm"
        />

        <View style={styles.buttons}>
          <Button
            variant="primary"
            fullWidth
            loading={isLoading}
            onPress={() => void handleSubmit()}
          >
            Create Agreement
          </Button>
          <Button variant="secondary" fullWidth onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: colors.bg },
  container:  { padding: spacing.base, gap: spacing.sm, paddingBottom: spacing['2xl'] },
  sectionGap: { marginTop: spacing.sm },
  buttons:    { gap: spacing.sm, marginTop: spacing.sm },
});
