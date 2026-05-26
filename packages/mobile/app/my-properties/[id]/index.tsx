import * as React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Card, Banner, Button, PropertyCard,
  colors, spacing, fontSize, fontWeight, borderRadius,
  PropertyStatus,
} from '@trustnest/ui-kit';
import { propertiesApi } from '@/api/properties';
import type { Property } from '@/types/api';

export default function ManagePropertyScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [property, setProperty]   = React.useState<Property | null>(null);
  const [loading, setLoading]     = React.useState(true);
  const [statusLoading, setStatusLoading] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [error, setError]         = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const p = await propertiesApi.get(id);
      setProperty(p);
    } catch {
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => { void load(); }, []);

  const handleStatusToggle = async (value: boolean) => {
    if (!property) return;
    const newStatus = value ? PropertyStatus.ACTIVE : PropertyStatus.PAUSED;
    setStatusLoading(true);
    try {
      const updated = await propertiesApi.updateStatus(id, newStatus);
      setProperty(updated);
    } catch (e) {
      setError('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await propertiesApi.delete(id);
      router.back();
    } catch (e) {
      setError('Failed to delete property');
      setDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
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

  const primaryImg = property.images.find(i => i.isPrimary)?.url
    ?? property.images[0]?.url
    ?? null;
  const isRented = property.status === PropertyStatus.RENTED;
  const isActive = property.status === PropertyStatus.ACTIVE;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Preview card */}
      <PropertyCard
        title={property.title}
        locality={property.locality}
        city={property.city}
        bhkType={property.bhkType}
        furnishingStatus={property.furnishingStatus}
        monthlyRentINR={Number(property.monthlyRentINR)}
        depositINR={Number(property.depositINR)}
        ownerName={property.ownerName}
        ownerScore={property.ownerScore}
        imageUrl={primaryImg}
        status={property.status}
      />

      {/* Status card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Listing Status</Text>
        {isRented ? (
          <View style={styles.rentedBadge}>
            <Text style={styles.rentedText}>RENTED</Text>
          </View>
        ) : (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {isActive ? 'Active — visible to tenants' : 'Paused — hidden from search'}
            </Text>
            {statusLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch
                value={isActive}
                onValueChange={(v) => { void handleStatusToggle(v); }}
                trackColor={{ true: colors.primary, false: '#D1D5DB' }}
              />
            )}
          </View>
        )}
      </Card>

      {/* Interested Tenants card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Interested Tenants</Text>
        <Button
          variant="secondary"
          onPress={() => router.push(`/my-properties/${id}/interests`)}
        >
          View Requests
        </Button>
      </Card>

      {error && <Banner variant="danger">{error}</Banner>}

      {/* Delete */}
      {!isRented && (
        <View style={styles.deleteSection}>
          {deleteConfirm ? (
            <Card style={styles.card}>
              <Banner variant="warning">
                Accepting will delete your listing. This cannot be undone.
              </Banner>
              <View style={styles.deleteRow}>
                <Button
                  variant="destructive"
                  size="sm"
                  loading={deleteLoading}
                  onPress={() => { void handleDelete(); }}
                  style={styles.flex}
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setDeleteConfirm(false)}
                  style={styles.flex}
                >
                  Cancel
                </Button>
              </View>
            </Card>
          ) : (
            <Button
              variant="destructive"
              fullWidth
              onPress={() => setDeleteConfirm(true)}
            >
              Delete Listing
            </Button>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.surface },
  content:     { padding: spacing.base, gap: spacing.base, paddingBottom: 40 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:   { color: colors.danger, fontSize: fontSize.base },
  card:        { gap: spacing.sm },
  cardTitle:   { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: fontSize.sm, color: colors.textSec, flex: 1 },
  rentedBadge: {
    backgroundColor: '#DBEAFE', borderRadius: borderRadius.sm,
    paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  rentedText:  { color: '#1D4ED8', fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  deleteSection: { marginTop: spacing.md },
  deleteRow:   { flexDirection: 'row', gap: spacing.sm },
  flex:        { flex: 1 },
});
