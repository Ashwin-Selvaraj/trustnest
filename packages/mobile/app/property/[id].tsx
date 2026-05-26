import * as React from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Switch,
  TouchableOpacity, TextInput as RNTextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PhotoGallery, Card, InfoRow, Banner, Button,
  colors, spacing, fontSize, fontWeight, borderRadius,
  BhkType, FurnishingStatus, PropertyStatus, InterestStatus,
} from '@trustnest/ui-kit';
import { propertiesApi } from '@/api/properties';
import type { Property, PropertyInterest } from '@/types/api';

const BHK_LABELS: Record<BhkType, string> = {
  [BhkType.STUDIO]:            'Studio',
  [BhkType.ONE_BHK]:           '1 BHK',
  [BhkType.TWO_BHK]:           '2 BHK',
  [BhkType.THREE_BHK]:         '3 BHK',
  [BhkType.FOUR_BHK_PLUS]:     '4+ BHK',
  [BhkType.VILLA]:              'Villa',
  [BhkType.INDEPENDENT_HOUSE]: 'Independent House',
};

const FURNISHING_LABELS: Record<FurnishingStatus, string> = {
  [FurnishingStatus.UNFURNISHED]:     'Unfurnished',
  [FurnishingStatus.SEMI_FURNISHED]:  'Semi-furnished',
  [FurnishingStatus.FULLY_FURNISHED]: 'Fully furnished',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PropertyDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [property, setProperty]   = React.useState<Property | null>(null);
  const [interest, setInterest]   = React.useState<PropertyInterest | null>(null);
  const [message, setMessage]     = React.useState('');
  const [loading, setLoading]     = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError]         = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [prop, myInterests] = await Promise.all([
          propertiesApi.get(id),
          propertiesApi.getMyInterests().catch(() => [] as PropertyInterest[]),
        ]);
        setProperty(prop);
        const existing = myInterests.find(i => i.propertyId === id) ?? null;
        setInterest(existing);
      } catch (e) {
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const handleExpressInterest = async () => {
    if (!property) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await propertiesApi.expressInterest(id, { message: message.trim() || undefined });
      setInterest(created);
    } catch (e) {
      setError('Failed to express interest. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!interest) return;
    setSubmitting(true);
    try {
      await propertiesApi.withdrawInterest(id, interest.id);
      setInterest(prev => prev ? { ...prev, status: InterestStatus.WITHDRAWN } : null);
    } catch (e) {
      setError('Failed to withdraw interest.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Property not found'}</Text>
      </View>
    );
  }

  const images = property.images.map(i => i.url);
  const ownerInitial = property.ownerName?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PhotoGallery images={images} height={260} />

        <View style={styles.content}>
          {/* Title + chips */}
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.location}>{property.locality}, {property.city}</Text>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{BHK_LABELS[property.bhkType]}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{FURNISHING_LABELS[property.furnishingStatus]}</Text>
            </View>
          </View>

          {/* Pricing card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Pricing</Text>
            <InfoRow
              label="Monthly Rent"
              value={`₹${Number(property.monthlyRentINR).toLocaleString('en-IN')}`}
              highlight
            />
            <InfoRow
              label="Security Deposit"
              value={`₹${Number(property.depositINR).toLocaleString('en-IN')}`}
            />
          </Card>

          {/* Details card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            <InfoRow label="Available from" value={formatDate(property.availableFrom)} />
            {property.areaSqft !== null && (
              <InfoRow label="Area" value={`${property.areaSqft} sq ft`} />
            )}
            {property.floorNumber !== null && (
              <InfoRow
                label="Floor"
                value={`${property.floorNumber}${property.totalFloors ? ` / ${property.totalFloors}` : ''}`}
              />
            )}
          </Card>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((a, idx) => (
                  <View key={idx} style={styles.amenityPill}>
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Owner card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Owner</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarText}>{ownerInitial}</Text>
              </View>
              <View>
                <Text style={styles.ownerName}>{property.ownerName}</Text>
                {property.ownerScore !== null && (
                  <Text style={styles.ownerScore}>★ {property.ownerScore.toFixed(1)}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* Description */}
          {property.description ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </Card>
          ) : null}

          {/* Interest message */}
          {interest === null && property.status === PropertyStatus.ACTIVE && (
            <RNTextInput
              style={styles.messageInput}
              placeholder="Add a message (optional)"
              placeholderTextColor={colors.textSec}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
          )}

          {error && <Banner variant="danger">{error}</Banner>}
          {/* bottom padding for fixed bar */}
          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* Fixed CTA bar */}
      <View style={styles.ctaBar}>
        {interest === null ? (
          <Button
            variant="primary"
            fullWidth
            loading={submitting}
            onPress={() => { void handleExpressInterest(); }}
          >
            Express Interest
          </Button>
        ) : interest.status === InterestStatus.PENDING ? (
          <View style={styles.ctaRow}>
            <Banner variant="success" style={styles.ctaBanner}>Interest sent ✓</Banner>
            <Button
              variant="secondary"
              size="sm"
              loading={submitting}
              onPress={() => { void handleWithdraw(); }}
            >
              Withdraw
            </Button>
          </View>
        ) : interest.status === InterestStatus.ACCEPTED && interest.agreementId ? (
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push(`/agreement/${interest.agreementId}`)}
          >
            View Agreement
          </Button>
        ) : (
          <Banner variant="info">Interest {interest.status.toLowerCase()}</Banner>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#FFFFFF' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:   { color: colors.danger, fontSize: fontSize.base },
  scroll:      { paddingBottom: spacing.xl },
  content:     { padding: spacing.base, gap: spacing.base },
  title:       { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.text },
  location:    { fontSize: fontSize.sm, color: colors.textSec },
  chipsRow:    { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#F3F4F6', borderRadius: borderRadius.sm,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  chipText:    { fontSize: fontSize.xs, color: colors.textSec, fontWeight: fontWeight.medium },
  card:        { gap: spacing.sm },
  cardTitle:   { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityPill: {
    backgroundColor: colors.primaryLight, borderRadius: borderRadius.full,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  amenityText: { fontSize: fontSize.xs, color: colors.primary },
  ownerRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ownerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ownerAvatarText: { color: '#FFFFFF', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  ownerName:   { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  ownerScore:  { fontSize: fontSize.sm, color: colors.warning },
  description: { fontSize: fontSize.sm, color: colors.textSec, lineHeight: 20 },
  messageInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.md, fontSize: fontSize.sm, color: colors.text,
    minHeight: 80, textAlignVertical: 'top',
  },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', padding: spacing.base,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ctaBanner: { flex: 1 },
});
