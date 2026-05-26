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
import { UserRole } from '@trustnest/shared';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';

/**
 * Complete Profile screen — step 2 of onboarding after OTP verification.
 * Collects full name, role, and date of birth.
 */
export default function CompleteProfileScreen(): React.ReactElement {
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [dob, setDob] = React.useState('');
  const [dobError, setDobError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const validateDob = (value: string): string | null => {
    const parts = value.split('/');
    if (parts.length !== 3) return 'Please enter date as DD/MM/YYYY';
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year || year < 1900) return 'Invalid date';
    const date = new Date(year, month - 1, day);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return 'Invalid date';
    }
    // Check 18+
    const today = new Date();
    const age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const isUnder18 =
      age < 18 ||
      (age === 18 && (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)));
    if (isUnder18) return 'You must be at least 18 years old';
    return null;
  };

  const handleDobChange = (text: string): void => {
    // Auto-insert slashes: DD/MM/YYYY
    let cleaned = text.replace(/[^0-9/]/g, '');
    if (
      (cleaned.length === 2 || cleaned.length === 5) &&
      text.length > dob.length &&
      !cleaned.endsWith('/')
    ) {
      cleaned = cleaned + '/';
    }
    setDob(cleaned);
    if (cleaned.length === 10) {
      setDobError(validateDob(cleaned));
    } else {
      setDobError(null);
    }
  };

  const dobToIso = (ddmmyyyy: string): string => {
    const [dd, mm, yyyy] = ddmmyyyy.split('/');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleContinue = async (): Promise<void> => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!role) {
      setError('Please select your role');
      return;
    }
    const dobValidation = validateDob(dob);
    if (dobValidation) {
      setDobError(dobValidation);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.completeProfile({
        name: fullName.trim(),
        role,
        dob: dobToIso(dob),
      });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    fullName.trim().length > 0 &&
    role !== null &&
    dob.length === 10 &&
    !dobError;

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
        {/* Progress bar — step 2/2 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressLabel}>Step 2 of 2</Text>
        </View>

        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>This information is used to verify your identity.</Text>

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="As per your government ID"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Role picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === UserRole.TENANT && styles.roleCardActive]}
              onPress={() => setRole(UserRole.TENANT)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleEmoji}>🧳</Text>
              <Text style={[styles.roleName, role === UserRole.TENANT && styles.roleNameActive]}>
                Tenant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === UserRole.OWNER && styles.roleCardActive]}
              onPress={() => setRole(UserRole.OWNER)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleEmoji}>🏠</Text>
              <Text style={[styles.roleName, role === UserRole.OWNER && styles.roleNameActive]}>
                Owner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === UserRole.BOTH && styles.roleCardActive]}
              onPress={() => setRole(UserRole.BOTH)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleEmoji}>🔄</Text>
              <Text style={[styles.roleName, role === UserRole.BOTH && styles.roleNameActive]}>
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={[styles.input, dobError ? styles.inputError : undefined]}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#9CA3AF"
            value={dob}
            onChangeText={handleDobChange}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            returnKeyType="done"
          />
          {dobError ? <Text style={styles.fieldError}>{dobError}</Text> : null}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={!isFormValid}
          onPress={() => void handleContinue()}
          style={styles.button}
        >Continue</Button>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  roleCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  roleEmoji: {
    fontSize: 22,
  },
  roleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleNameActive: {
    color: '#2563EB',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
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
