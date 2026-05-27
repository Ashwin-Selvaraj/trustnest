/**
 * Edit Personal Info screen.
 * Lets the user update their legal name and role.
 * DOB is identity-locked and cannot be changed after KYC.
 *
 * Design ref: 05 _ Edit Personal Info screenshot.
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  NavHeader, Banner, TextInput, SelectableCard, Button,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { UserRole } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';
import { useUserContext } from '@/store/user-context';
import { usersApi } from '@/api/users';
import { ApiError } from '@/api/client';

// ─── Role options ─────────────────────────────────────────────────────────────

const ROLES: { value: UserRole; emoji: string; title: string; subtitle: string }[] = [
  {
    value:    UserRole.OWNER,
    emoji:    '🏠',
    title:    'Property Owner',
    subtitle: 'I own properties and want to rent them out',
  },
  {
    value:    UserRole.TENANT,
    emoji:    '🧳',
    title:    'Tenant',
    subtitle: "I'm looking to rent a property",
  },
  {
    value:    UserRole.BOTH,
    emoji:    '🔄',
    title:    'Both',
    subtitle: 'I both own properties and look for rentals',
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen(): React.ReactElement {
  const { state, setUser } = useAuth();
  const { setProfile }     = useUserContext();
  const { user }           = state;

  const [fullName, setFullName] = React.useState(user?.fullName ?? '');
  const [nameError, setNameError] = React.useState<string | undefined>();
  const [role, setRole] = React.useState<UserRole>(user?.role ?? UserRole.TENANT);
  const [isLoading, setIsLoading] = React.useState(false);
  const [apiError, setApiError]   = React.useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    if (!fullName.trim()) {
      setNameError('Full name is required');
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const updated = await usersApi.updateMe({ fullName: fullName.trim(), role });
      setUser(updated);
      setProfile(fullName.trim(), role);
      router.back();
    } catch (err: unknown) {
      setApiError(err instanceof ApiError ? err.message : 'Could not save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavHeader title="Edit Personal Info" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <Banner variant="info">
            Your name appears on every rental agreement. Updates apply to new agreements
            only — existing ones keep the name you signed with.
          </Banner>

          {/* Full Name */}
          <TextInput
            label="Full Name"
            placeholder="As per your government ID"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              if (nameError) setNameError(undefined);
              if (apiError) setApiError(null);
            }}
            error={nameError}
            hint="Enter your name exactly as it appears on your government ID."
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Role */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>I am a…</Text>
            <View style={styles.roleList}>
              {ROLES.map((r) => (
                <SelectableCard
                  key={r.value}
                  selected={role === r.value}
                  onSelect={() => setRole(r.value)}
                  icon={<Text style={styles.roleEmoji}>{r.emoji}</Text>}
                  title={r.title}
                  subtitle={r.subtitle}
                />
              ))}
            </View>
          </View>

          {apiError ? (
            <Banner variant="danger">{apiError}</Banner>
          ) : null}

          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              loading={isLoading}
              onPress={() => void handleSave()}
            >
              Save Changes
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={isLoading}
              onPress={() => router.back()}
            >
              Cancel
            </Button>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  flex:    { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.md },

  roleSection: { gap: spacing.xs },
  roleLabel: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  roleList:  { gap: spacing.sm },
  roleEmoji: { fontSize: 22 },

  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
