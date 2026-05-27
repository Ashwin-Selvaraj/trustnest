import * as React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button, TextInput, ProgressBar, SectionHeader, Banner,
  colors, spacing, fontSize, fontWeight, borderRadius,
} from '@trustnest/ui-kit';
import { BhkType, FurnishingStatus, TenantPreference, PropertyStatus } from '@trustnest/shared';
import { propertiesApi } from '@/api/properties';
import type { CreatePropertyRequest } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  title: string;
  address: string;
  city: string;
  locality: string;
  // Step 2
  bhkType: BhkType | null;
  furnishingStatus: FurnishingStatus | null;
  areaSqft: string;
  floorNumber: string;
  totalFloors: string;
  // Step 3
  monthlyRentINR: string;
  depositINR: string;
  availableFrom: string;
  // Step 4
  preferredTenants: TenantPreference[];
  amenities: string[];
  description: string;
}

const INITIAL_FORM: FormData = {
  title: '',
  address: '',
  city: '',
  locality: '',
  bhkType: null,
  furnishingStatus: null,
  areaSqft: '',
  floorNumber: '',
  totalFloors: '',
  monthlyRentINR: '',
  depositINR: '',
  availableFrom: '',
  preferredTenants: [],
  amenities: [],
  description: '',
};

// ─── Chip helpers ────────────────────────────────────────────────────────────

const BHK_OPTIONS: { value: BhkType; label: string }[] = [
  { value: BhkType.STUDIO,            label: 'Studio' },
  { value: BhkType.ONE_BHK,           label: '1 BHK' },
  { value: BhkType.TWO_BHK,           label: '2 BHK' },
  { value: BhkType.THREE_BHK,         label: '3 BHK' },
  { value: BhkType.FOUR_BHK_PLUS,     label: '4+ BHK' },
  { value: BhkType.VILLA,             label: 'Villa' },
  { value: BhkType.INDEPENDENT_HOUSE, label: 'Ind. House' },
];

const FURNISHING_OPTIONS: { value: FurnishingStatus; label: string }[] = [
  { value: FurnishingStatus.UNFURNISHED,    label: 'Unfurnished' },
  { value: FurnishingStatus.SEMI_FURNISHED, label: 'Semi' },
  { value: FurnishingStatus.FULLY_FURNISHED, label: 'Fully' },
];

const TENANT_PREF_OPTIONS: { value: TenantPreference; label: string }[] = [
  { value: TenantPreference.FAMILY,               label: 'Family' },
  { value: TenantPreference.BACHELORS,             label: 'Bachelors' },
  { value: TenantPreference.WORKING_PROFESSIONAL,  label: 'Working Pro' },
  { value: TenantPreference.STUDENTS,              label: 'Students' },
  { value: TenantPreference.ANY,                   label: 'Any' },
];

const AMENITY_OPTIONS = [
  'Parking', 'Lift', 'Gym', 'Swimming Pool',
  'Power Backup', 'Security', 'Gas Pipeline', 'WiFi',
];

const TOTAL_STEPS = 6;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatePropertyScreen(): React.ReactElement {
  const router = useRouter();
  const [step, setStep]     = React.useState(1);
  const [form, setForm]     = React.useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]): void => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  };

  const toggleMulti = (key: 'preferredTenants' | 'amenities', value: string): void => {
    const arr = form[key] as string[];
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    set(key as 'amenities', next as string[]);
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!form.title.trim())   e.title   = 'Title is required';
      if (!form.address.trim()) e.address = 'Address is required';
      if (!form.city.trim())    e.city    = 'City is required';
      if (!form.locality.trim()) e.locality = 'Locality is required';
    }
    if (step === 2) {
      if (!form.bhkType)          e.bhkType          = 'Select property type';
      if (!form.furnishingStatus) e.furnishingStatus = 'Select furnishing status';
    }
    if (step === 3) {
      const rent = parseInt(form.monthlyRentINR.replace(/,/g, ''), 10);
      if (!rent || rent < 1000) e.monthlyRentINR = 'Rent must be at least ₹1,000';
      const dep = parseInt(form.depositINR.replace(/,/g, ''), 10);
      if (!dep || dep < 1000)   e.depositINR = 'Deposit must be at least ₹1,000';
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.availableFrom))
        e.availableFrom = 'Use format DD/MM/YYYY';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (): void => {
    if (validateStep()) setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };
  const handleBack = (): void => setStep(s => Math.max(s - 1, 1));

  // ── Submission ──────────────────────────────────────────────────────────────

  const buildPayload = (): CreatePropertyRequest => {
    const [dd, mm, yyyy] = form.availableFrom.split('/');
    return {
      title:             form.title.trim(),
      address:           form.address.trim(),
      city:              form.city.trim(),
      locality:          form.locality.trim(),
      bhkType:           form.bhkType!,
      furnishingStatus:  form.furnishingStatus!,
      monthlyRentINR:    parseInt(form.monthlyRentINR.replace(/,/g, ''), 10),
      depositINR:        parseInt(form.depositINR.replace(/,/g, ''), 10),
      areaSqft:          form.areaSqft ? parseInt(form.areaSqft, 10) : undefined,
      floorNumber:       form.floorNumber ? parseInt(form.floorNumber, 10) : undefined,
      totalFloors:       form.totalFloors ? parseInt(form.totalFloors, 10) : undefined,
      description:       form.description.trim() || undefined,
      amenities:         form.amenities,
      preferredTenants:  form.preferredTenants,
      availableFrom:     `${yyyy}-${mm}-${dd}`,
    };
  };

  const handleSaveDraft = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const property = await propertiesApi.create(buildPayload());
      router.replace(`/my-properties/${property.id}`);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const property = await propertiesApi.create(buildPayload());
      await propertiesApi.updateStatus(property.id, PropertyStatus.ACTIVE);
      router.replace(`/my-properties/${property.id}`);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to publish listing');
    } finally {
      setSubmitting(false);
    }
  };

  // ── INR quick-format ────────────────────────────────────────────────────────

  const formatINRInput = (raw: string): string =>
    raw.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const autoDeposit = (multiplier: number): void => {
    const rent = parseInt(form.monthlyRentINR.replace(/,/g, ''), 10);
    if (rent) set('depositINR', formatINRInput(String(rent * multiplier)));
  };

  // ─── Render steps ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <SectionHeader>Where is the property?</SectionHeader>
      <TextInput
        label="Property Title"
        placeholder="e.g. 2BHK in Indiranagar"
        value={form.title}
        onChangeText={t => set('title', t)}
        error={errors.title}
      />
      <TextInput
        label="Full Address"
        placeholder="Street, area, pincode"
        value={form.address}
        onChangeText={t => set('address', t)}
        error={errors.address}
        multiline
        numberOfLines={2}
      />
      <TextInput
        label="City"
        placeholder="Bengaluru"
        value={form.city}
        onChangeText={t => set('city', t)}
        error={errors.city}
      />
      <TextInput
        label="Locality / Area"
        placeholder="Indiranagar"
        value={form.locality}
        onChangeText={t => set('locality', t)}
        error={errors.locality}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <SectionHeader>Property type</SectionHeader>
      {errors.bhkType && <Text style={styles.fieldError}>{errors.bhkType}</Text>}
      <View style={styles.chipGrid}>
        {BHK_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, form.bhkType === opt.value && styles.chipSelected]}
            onPress={() => set('bhkType', opt.value)}
          >
            <Text style={[styles.chipText, form.bhkType === opt.value && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader style={styles.sectionGap}>Furnishing</SectionHeader>
      {errors.furnishingStatus && <Text style={styles.fieldError}>{errors.furnishingStatus}</Text>}
      <View style={styles.chipRow}>
        {FURNISHING_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, styles.chipFlex, form.furnishingStatus === opt.value && styles.chipSelected]}
            onPress={() => set('furnishingStatus', opt.value)}
          >
            <Text style={[styles.chipText, form.furnishingStatus === opt.value && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader style={styles.sectionGap}>Size (optional)</SectionHeader>
      <TextInput
        label="Area (sq ft)"
        placeholder="950"
        value={form.areaSqft}
        onChangeText={t => set('areaSqft', t.replace(/\D/g, ''))}
        keyboardType="number-pad"
      />
      <View style={styles.row}>
        <View style={styles.halfField}>
          <TextInput
            label="Floor"
            placeholder="3"
            value={form.floorNumber}
            onChangeText={t => set('floorNumber', t.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.halfField}>
          <TextInput
            label="Total Floors"
            placeholder="10"
            value={form.totalFloors}
            onChangeText={t => set('totalFloors', t.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <SectionHeader>Rent & deposit</SectionHeader>
      <TextInput
        label="Monthly Rent"
        currencyPrefix="₹"
        keyboardType="numeric"
        placeholder="25,000"
        value={form.monthlyRentINR}
        onChangeText={t => set('monthlyRentINR', formatINRInput(t))}
        error={errors.monthlyRentINR}
      />
      <TextInput
        label="Security Deposit"
        currencyPrefix="₹"
        keyboardType="numeric"
        placeholder="75,000"
        value={form.depositINR}
        onChangeText={t => set('depositINR', formatINRInput(t))}
        error={errors.depositINR}
        hint="Typically 2–3 months' rent"
      />
      {/* Quick-fill chips */}
      <View style={styles.chipRow}>
        {[2, 3].map(x => (
          <TouchableOpacity key={x} style={styles.chip} onPress={() => autoDeposit(x)}>
            <Text style={styles.chipText}>{x}× rent</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader style={styles.sectionGap}>Availability</SectionHeader>
      <TextInput
        label="Available From"
        placeholder="DD/MM/YYYY"
        value={form.availableFrom}
        onChangeText={t => set('availableFrom', t)}
        error={errors.availableFrom}
        hint="Date the property becomes available"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <SectionHeader>Preferred tenants</SectionHeader>
      <View style={styles.chipRow}>
        {TENANT_PREF_OPTIONS.map(opt => {
          const selected = form.preferredTenants.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleMulti('preferredTenants', opt.value)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader style={styles.sectionGap}>Amenities</SectionHeader>
      <View style={styles.chipRow}>
        {AMENITY_OPTIONS.map(a => {
          const selected = form.amenities.includes(a);
          return (
            <TouchableOpacity
              key={a}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleMulti('amenities', a)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{a}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader style={styles.sectionGap}>Description (optional)</SectionHeader>
      <TextInput
        label="Description"
        placeholder="Describe the property, neighbourhood, and any special features…"
        value={form.description}
        onChangeText={t => set('description', t)}
        multiline
        numberOfLines={4}
        hint={`${form.description.length} / 500 characters`}
      />
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <SectionHeader>Photos (up to 10)</SectionHeader>
      <Banner variant="info">
        Photo upload will be available in the next release. You can add photos after creating the listing.
      </Banner>
      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoEmoji}>📷</Text>
        <Text style={styles.photoPlaceholderText}>Photos coming soon</Text>
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <SectionHeader>Review your listing</SectionHeader>
      <View style={styles.summaryCard}>
        <SummaryRow label="Title"          value={form.title || '—'} />
        <SummaryRow label="Address"        value={form.address || '—'} />
        <SummaryRow label="City"           value={`${form.city}, ${form.locality}` || '—'} />
        <SummaryRow label="Type"           value={BHK_OPTIONS.find(o => o.value === form.bhkType)?.label ?? '—'} />
        <SummaryRow label="Furnishing"     value={FURNISHING_OPTIONS.find(o => o.value === form.furnishingStatus)?.label ?? '—'} />
        <SummaryRow label="Monthly Rent"   value={form.monthlyRentINR ? `₹${form.monthlyRentINR}` : '—'} />
        <SummaryRow label="Deposit"        value={form.depositINR ? `₹${form.depositINR}` : '—'} />
        <SummaryRow label="Available From" value={form.availableFrom || '—'} />
        {form.amenities.length > 0 && (
          <SummaryRow label="Amenities" value={form.amenities.join(', ')} />
        )}
      </View>

      <View style={styles.submitButtons}>
        <Button
          variant="secondary"
          fullWidth
          loading={submitting}
          onPress={() => void handleSaveDraft()}
          style={styles.submitBtn}
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          fullWidth
          loading={submitting}
          onPress={() => void handlePublish()}
        >
          Publish Listing
        </Button>
      </View>
    </View>
  );

  const STEP_RENDERERS = [
    renderStep1, renderStep2, renderStep3,
    renderStep4, renderStep5, renderStep6,
  ];

  // ─── Layout ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <ProgressBar step={step} total={TOTAL_STEPS} />
        <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {STEP_RENDERERS[step - 1]?.()}
      </ScrollView>

      {/* Navigation */}
      {step < TOTAL_STEPS && (
        <View style={styles.navBar}>
          {step > 1 && (
            <Button variant="secondary" onPress={handleBack} style={styles.navBtn}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            onPress={handleNext}
            style={[styles.navBtn, step === 1 && styles.navBtnFull]}
            fullWidth={step === 1}
          >
            Next
          </Button>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Summary row helper ───────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },

  progressContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  stepLabel: {
    fontSize: fontSize.xs,
    color: colors.textSec,
    fontWeight: fontWeight.medium,
    textAlign: 'right',
  },

  scrollContent: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  stepContent: {
    gap: spacing.md,
  },
  sectionGap: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipFlex: {
    flex: 1,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  fieldError: {
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: -spacing.xs,
  },

  // Photos placeholder
  photoPlaceholder: {
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  photoEmoji: { fontSize: 40 },
  photoPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textSec,
  },

  // Review summary
  summaryCard: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSec,
    flex: 1,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    flex: 2,
    textAlign: 'right',
  },

  // Submit
  submitButtons: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginBottom: spacing.xs,
  },

  // Bottom nav bar
  navBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  navBtn: {
    flex: 1,
  },
  navBtnFull: {
    flex: 1,
  },
});
