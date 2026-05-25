import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, TextInput } from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { ApiError } from '@/api/client';

/**
 * Dispute screen — allows either party to raise a dispute with a written reason.
 * Transitions agreement to DISPUTED status and queues raiseDispute on-chain via BlockchainJob.
 */
export default function DisputeScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (reason.trim().length < 20) {
      setError('Please describe the dispute in at least 20 characters.');
      return;
    }
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      await agreementsApi.raiseDispute(id, { reason: reason.trim() });
      Alert.alert(
        'Dispute Raised',
        'Our admin team will review your case within 24–48 hours and contact both parties.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              router.back(); // Go back two levels to the detail screen
            },
          },
        ],
      );
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to raise dispute. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Raise a Formal Dispute</Text>
            <Text style={styles.warningBody}>
              Raising a dispute will freeze the escrow. An admin will review your case and
              determine how the deposit is distributed.
            </Text>
          </View>
        </View>

        {/* Reason input */}
        <TextInput
          label="Reason for Dispute"
          placeholder="Describe what happened and why you're raising this dispute…"
          value={reason}
          onChangeText={(t) => {
            setReason(t);
            if (error) setError(null);
          }}
          multiline
          numberOfLines={6}
          error={error ?? undefined}
          hint={`${reason.length} characters (minimum 20)`}
          style={styles.textarea}
        />

        <Text style={styles.guideTitle}>What to include:</Text>
        {[
          'Date when the issue started',
          'What was agreed vs. what happened',
          'Any evidence (photos, messages) — upload after submitting',
          'Amount you believe you are owed',
        ].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        <Button
          label="Submit Dispute"
          variant="destructive"
          fullWidth
          loading={isLoading}
          onPress={() => void handleSubmit()}
          style={styles.submitButton}
        />

        <Button
          label="Cancel"
          variant="secondary"
          fullWidth
          onPress={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  warningEmoji: { fontSize: 24 },
  warningText: { flex: 1, gap: 4 },
  warningTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B' },
  warningBody: { fontSize: 13, color: '#7F1D1D', lineHeight: 19 },
  textarea: { minHeight: 120 },
  guideTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: { color: '#6B7280', fontSize: 14, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },
  submitButton: { marginTop: 8 },
});
