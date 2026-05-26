import * as React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Banner, InterestStatusChip,
  colors, spacing, fontSize, fontWeight, borderRadius, shadow,
  PropertyStatus, InterestStatus,
} from '@trustnest/ui-kit';
import { propertiesApi } from '@/api/properties';
import type { PropertyInterest } from '@/types/api';

export default function MyInterestsScreen(): React.ReactElement {
  const router = useRouter();
  const [interests, setInterests] = React.useState<PropertyInterest[]>([]);
  const [loading, setLoading]     = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    try {
      const data = await propertiesApi.getMyInterests();
      setInterests(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={interests}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      ListEmptyComponent={
        <Banner variant="info">No interests yet. Browse properties to get started.</Banner>
      }
      renderItem={({ item }) => {
        const prop = item.property;
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/property/${item.propertyId}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleBlock}>
                <Text style={styles.title} numberOfLines={1}>
                  {prop?.title ?? 'Property'}
                </Text>
                {prop && (
                  <Text style={styles.location}>{prop.locality}, {prop.city}</Text>
                )}
              </View>
              <InterestStatusChip status={item.status} size="sm" />
            </View>

            {prop && (
              <Text style={styles.rent}>
                ₹{Number(prop.monthlyRentINR).toLocaleString('en-IN')}/mo
              </Text>
            )}

            <Text style={styles.date}>
              Applied: {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.base,
    gap:     spacing.md,
    backgroundColor: colors.surface,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.base,
    gap:             spacing.sm,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            spacing.sm,
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
  },
  location: { fontSize: fontSize.sm, color: colors.textSec },
  rent: {
    fontSize:   fontSize.md,
    fontWeight: fontWeight.bold,
    color:      colors.primary,
  },
  date: { fontSize: fontSize.xs, color: colors.textSec },
});
