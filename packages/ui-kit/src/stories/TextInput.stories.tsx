import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from '../components/TextInput';
import { spacing } from '../theme';

export default {
  title: 'Components/TextInput',
  component: TextInput,
};

export const Default = (): React.ReactElement => (
  <View style={styles.container}>
    <TextInput label="Full Name" placeholder="Ashwin Selvaraj" />
    <TextInput label="Phone" placeholder="+91 98765 43210" keyboardType="phone-pad" />
  </View>
);

export const WithCurrencyPrefix = (): React.ReactElement => (
  <View style={styles.container}>
    <TextInput
      label="Monthly Rent"
      currencyPrefix="₹"
      keyboardType="numeric"
      placeholder="25,000"
      hint="Enter amount in INR"
    />
    <TextInput
      label="Security Deposit"
      currencyPrefix="₹"
      keyboardType="numeric"
      placeholder="75,000"
    />
  </View>
);

export const WithError = (): React.ReactElement => (
  <View style={styles.container}>
    <TextInput
      label="Phone Number"
      value="123"
      error="Enter a valid 10-digit mobile number"
    />
    <TextInput
      label="Security Deposit"
      currencyPrefix="₹"
      value="500"
      error="Deposit must be at least ₹10,000"
    />
  </View>
);

export const Disabled = (): React.ReactElement => (
  <View style={styles.container}>
    <TextInput label="Agreement ID" value="AGR-2025-001" editable={false} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: spacing['2xl'],
    gap: spacing.base,
  },
});
