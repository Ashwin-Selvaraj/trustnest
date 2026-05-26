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
import {
  NavHeader, Banner, SectionHeader, Button, TextInput,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { agreementsApi } from '@/api/agreements';
import { ApiError } from '@/api/client';

export default function DisputeScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = React.useState('');
  const [error, setError]   = React.useState<string | null>(null);
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
        [{ text: 'OK', onPress: () => { router.back(); router.back(); } }],
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
      <NavHeader title="Raise Dispute" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Danger banner */}
        <Banner variant="danger">
          Filing a dispute pauses the escrow. Provide accurate details — false claims affect your
          reputation score. An admin will review your case and determine how the deposit is
          distributed.
        </Banner>

        {/* Reason */}
        <SectionHeader>Reason for Dispute</SectionHeader>
        <TextInput
          label="Reason"
          placeholder="Describe what happened and why you're raising this dispute…"
          value={reason}
          onChangeText={(t) => { setReason(t); if (error) setError(null); }}
          multiline
          numberOfLines={6}
          error={error ?? undefined}
          hint={`${reason.length} characters (minimum 20)`}
          style={styles.textarea}
        />

        {/* Guidance */}
        <View style={styles.guideBlock}>
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
        </View>

        <View style={styles.buttons}>
          <Button
            variant="destructive"
            fullWidth
            loading={isLoading}
            onPress={() => void handleSubmit()}
          >
            Submit Dispute
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
  flex:      { flex: 1, backgroundColor: colors.bg },
  content:   { padding: spacing.base, gap: spacing.base, paddingBottom: spacing['2xl'] },
  textarea:  { minHeight: 120 },
  guideBlock: { gap: spacing.sm },
  guideTitle: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
  },
  bulletRow:  { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet:     { color: colors.textSec, fontSize: fontSize.sm, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: fontSize.sm, color: colors.textSec, lineHeight: 20 },
  buttons:    { gap: spacing.sm },
});
