/**
 * SignInPrompt — full-screen prompt shown in place of authenticated-only
 * content when the visitor is browsing as a guest.
 *
 * Guest-mode architecture: browsing/discovery is public; anything that acts
 * on the user's behalf (agreements, interests, listings, profile) requires
 * signing in. Screens render this instead of redirecting so guests keep
 * their place in the app.
 */
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, colors, spacing, fontSize, fontWeight } from '@trustnest/ui-kit';

export interface SignInPromptProps {
  emoji?: string;
  title: string;
  message: string;
}

export function SignInPrompt({ emoji = '🔐', title, message }: SignInPromptProps): React.ReactElement {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button
        variant="primary"
        fullWidth
        onPress={() => router.push('/(auth)/phone')}
        style={styles.button}
      >
        Sign In with Mobile Number
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  emoji: { fontSize: 52, marginBottom: spacing.xs },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSec,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: { marginTop: spacing.md },
});
