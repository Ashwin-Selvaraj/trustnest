/**
 * Profile Setup screen — step 1 of onboarding after OTP.
 * Collects full name, role, and date of birth; then proceeds to KYC intro.
 * Uses ui-kit design tokens throughout.
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  NavHeader, TextInput, Button, ProgressBar,
  colors, spacing, fontSize, fontWeight, borderRadius,
} from '@trustnest/ui-kit';
import { UserRole } from '@trustnest/shared';
import { authApi } from '@/api/auth';
import { useUserContext } from '@/store/user-context';
import { useAuth } from '@/store/auth.store';
import { ApiError } from '@/api/client';
import { usersApi } from '@/api/users';

// ─── Role chip config ─────────────────────────────────────────────────────────

const ROLES: { value: UserRole; emoji: string; label: string }[] = [
  { value: UserRole.TENANT, emoji: '🧳', label: 'Tenant' },
  { value: UserRole.OWNER,  emoji: '🏠', label: 'Owner'  },
  { value: UserRole.BOTH,   emoji: '🔄', label: 'Both'   },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileSetupScreen(): React.ReactElement {
  const { setProfile } = useUserContext();
  const { setUser } = useAuth();

  const [fullName, setFullName] = React.useState('');
  const [nameError, setNameError] = React.useState<string | undefined>();
  const [role, setRole]           = React.useState<UserRole | null>(null);
  const [roleError, setRoleError] = React.useState<string | undefined>();
  const [dob, setDob]             = React.useState('');
  const [dobError, setDobError]   = React.useState<string | undefined>();
  const [isLoading, setIsLoading] = React.useState(false);

  // ─── DOB helpers ─────────────────────────────────────────────────────────────

  const validateDob = (value: string): string | undefined => {
    if (value.length < 10) return 'Use format DD/MM/YYYY';
    const [dd, mm, yyyy] = value.split('/').map(Number);
    if (!dd || !mm || !yyyy || yyyy < 1900) return 'Invalid date';
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy) {
      return 'Invalid date';
    }
    const today = new Date();
    const age = today.getFullYear() - yyyy;
    const monthDiff = today.getMonth() - (mm - 1);
    const under18 =
      age < 18 ||
      (age === 18 && (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dd)));
    if (under18) return 'You must be at least 18 years old';
    return undefined;
  };

  const handleDobChange = (text: string): void => {
    let v = text.replace(/[^0-9/]/g, '');
    if ((v.length === 2 || v.length === 5) && text.length > dob.length && !v.endsWith('/')) {
      v = v + '/';
    }
    setDob(v);
    if (v.length === 10) setDobError(validateDob(v));
    else setDobError(undefined);
  };

  const dobToIso = (ddmmyyyy: string): string => {
    const [dd, mm, yyyy] = ddmmyyyy.split('/');
    return `${yyyy}-${mm}-${dd}`;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const handleContinue = async (): Promise<void> => {
    let valid = true;
    if (!fullName.trim()) {
      setNameError('Full name is required');
      valid = false;
    }
    if (!role) {
      setRoleError('Please choose your role');
      valid = false;
    }
    const de = validateDob(dob);
    if (de) {
      setDobError(de);
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    try {
      await authApi.completeProfile({
        name: fullName.trim(),
        role:  role!,
        dob:  dobToIso(dob),
      });
      // Refresh auth user so profile-complete flag is true
      try {
        const user = await usersApi.getMe();
        setUser(user);
      } catch {
        // non-fatal
      }
      setProfile(fullName.trim(), role!);
      router.replace('/(auth)/kyc-intro');
    } catch (err: unknown) {
      setNameError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    fullName.trim().length > 0 && role !== null && dob.length === 10 && !dobError;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <NavHeader title="Profile Setup" onBack={undefined} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              This information is stored securely and used to verify your identity.
            </Text>
          </View>

          {/* Full Name */}
          <TextInput
            label="Full Name"
            placeholder="As per your government ID"
            value={fullName}
            onChangeText={(t) => { setFullName(t); if (nameError) setNameError(undefined); }}
            error={nameError}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Role picker */}
          <View>
            <Text style={styles.fieldLabel}>I am a</Text>
            <View style={styles.roleRow}>
              {ROLES.map(({ value, emoji, label }) => (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.75}
                  style={[styles.roleCard, role === value && styles.roleCardActive]}
                  onPress={() => { setRole(value); setRoleError(undefined); }}
                >
                  <Text style={styles.roleEmoji}>{emoji}</Text>
                  <Text style={[styles.roleName, role === value && styles.roleNameActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {roleError ? <Text style={styles.fieldError}>{roleError}</Text> : null}
          </View>

          {/* Date of Birth */}
          <TextInput
            label="Date of Birth"
            placeholder="DD/MM/YYYY"
            value={dob}
            onChangeText={handleDobChange}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={dobError}
            hint="You must be 18 years or older"
            returnKeyType="done"
          />

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={!isFormValid}
              onPress={() => void handleContinue()}
            >
              Continue
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onPress={() => router.replace('/(tabs)')}
            >
              I'll do this later
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  flex:     { flex: 1 },
  content:  { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.md },
  heading:  { gap: spacing.xs },
  title: {
    fontSize:   fontSize.xl,
    fontWeight: fontWeight.bold,
    color:      colors.text,
  },
  subtitle: {
    fontSize:   fontSize.sm,
    color:      colors.textSec,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.semibold,
    color:        colors.text,
    marginBottom: spacing.xs,
  },
  roleRow:     { flexDirection: 'row', gap: spacing.sm },
  roleCard: {
    flex:            1,
    borderWidth:     1.5,
    borderColor:     colors.border,
    borderRadius:    borderRadius.md,
    paddingVertical: spacing.md,
    alignItems:      'center',
    backgroundColor: colors.surface,
    gap:             spacing.xs,
  },
  roleCardActive: {
    borderColor:     colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleEmoji: { fontSize: 22 },
  roleName: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.textSec,
  },
  roleNameActive: { color: colors.primary },
  fieldError: {
    fontSize:  fontSize.xs,
    color:     colors.danger,
    marginTop: spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
