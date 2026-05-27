/**
 * KYC Document screen — step 1 of 3.
 * User selects which government ID they will upload.
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
  NavHeader, ProgressBar, SelectableCard, Button,
  colors, spacing,
} from '@trustnest/ui-kit';
import { useUserContext } from '@/store/user-context';

type DocType = 'aadhaar' | 'pan';

interface DocOption {
  id:       DocType;
  icon:     string;
  title:    string;
  subtitle: string;
  badge:    string;
}

const DOC_OPTIONS: DocOption[] = [
  {
    id:       'aadhaar',
    icon:     '🪪',
    title:    'Aadhaar Card',
    subtitle: "India's national identity card (UIDAI). Accepted everywhere.",
    badge:    'Recommended',
  },
  {
    id:       'pan',
    icon:     '💳',
    title:    'PAN Card',
    subtitle: 'Permanent Account Number — issued by Income Tax Dept.',
    badge:    '',
  },
];

export default function KycDocumentScreen(): React.ReactElement {
  const { setKycDoc } = useUserContext();
  const [selected, setSelected] = React.useState<DocType | null>(null);

  const handleContinue = (): void => {
    if (!selected) return;
    setKycDoc(selected);
    router.push(`/(auth)/kyc-upload?docType=${selected}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavHeader title="Choose Document" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <ProgressBar step={1} total={3} />

        <View style={styles.cards}>
          {DOC_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.id}
              selected={selected === opt.id}
              onSelect={() => setSelected(opt.id)}
              icon={<Text style={{ fontSize: 22 }}>{opt.icon}</Text>}
              title={opt.title}
              subtitle={opt.subtitle}
              badge={opt.badge || undefined}
            />
          ))}
        </View>

        <Button
          variant="primary"
          fullWidth
          disabled={!selected}
          onPress={handleContinue}
        >
          Continue
        </Button>
        <Button variant="secondary" fullWidth onPress={() => router.replace('/(tabs)')}>
          I'll do this later
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.md },
  cards:   { gap: spacing.sm },
});
