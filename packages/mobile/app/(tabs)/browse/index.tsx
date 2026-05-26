import * as React from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth.store';
import {
  PropertyCard, FilterBar, Banner, FAB,
  colors, spacing, fontSize, fontWeight, borderRadius,
  BhkType, FurnishingStatus, PropertyStatus,
} from '@trustnest/ui-kit';
import { UserRole } from '@trustnest/shared';
import { propertiesApi } from '@/api/properties';
import type { Property } from '@/types/api';

// ─── Filter definitions ───────────────────────────────────────────────────────

const BHK_FILTERS = [
  { key: BhkType.STUDIO,        label: 'Studio' },
  { key: BhkType.ONE_BHK,       label: '1 BHK'  },
  { key: BhkType.TWO_BHK,       label: '2 BHK'  },
  { key: BhkType.THREE_BHK,     label: '3 BHK'  },
  { key: BhkType.FOUR_BHK_PLUS, label: '4 BHK+' },
];

const RENT_FILTERS = [
  { key: 'lt15k',  label: '< ₹15k'    },
  { key: '15-30k', label: '₹15–30k'   },
  { key: 'gt30k',  label: '> ₹30k'    },
];

const FURNISHING_FILTERS = [
  { key: FurnishingStatus.UNFURNISHED,    label: 'Unfurnished' },
  { key: FurnishingStatus.SEMI_FURNISHED, label: 'Semi'        },
  { key: FurnishingStatus.FULLY_FURNISHED,label: 'Fully'       },
];

// ─── Browse View ─────────────────────────────────────────────────────────────

function BrowseView(): React.ReactElement {
  const router = useRouter();
  const [searchText, setSearchText] = React.useState('');
  const [selectedBhk, setSelectedBhk]     = React.useState<string[]>([]);
  const [selectedRent, setSelectedRent]   = React.useState<string[]>([]);
  const [selectedFurn, setSelectedFurn]   = React.useState<string[]>([]);
  const [properties, setProperties]       = React.useState<Property[]>([]);
  const [total, setTotal]                 = React.useState(0);
  const [page, setPage]                   = React.useState(1);
  const [loading, setLoading]             = React.useState(false);
  const [refreshing, setRefreshing]       = React.useState(false);
  const [endReached, setEndReached]       = React.useState(false);

  const LIMIT = 20;

  const getRentRange = (): { minRent?: number; maxRent?: number } => {
    if (selectedRent.includes('lt15k'))  return { maxRent: 15000 };
    if (selectedRent.includes('15-30k')) return { minRent: 15000, maxRent: 30000 };
    if (selectedRent.includes('gt30k'))  return { minRent: 30000 };
    return {};
  };

  const loadProperties = React.useCallback(
    async (pageNum: number, reset: boolean) => {
      if (loading) return;
      setLoading(true);
      try {
        const rentRange = getRentRange();
        const params: Parameters<typeof propertiesApi.search>[0] = {
          page:  pageNum,
          limit: LIMIT,
          ...rentRange,
        };
        if (searchText.trim()) params.city = searchText.trim();
        if (selectedBhk.length === 1) params.bhkType = selectedBhk[0] as BhkType;
        if (selectedFurn.length === 1) params.furnishingStatus = selectedFurn[0] as FurnishingStatus;

        const res = await propertiesApi.search(params);
        setTotal(res.total);
        if (reset) {
          setProperties(res.data);
        } else {
          setProperties(prev => [...prev, ...res.data]);
        }
        setEndReached(pageNum * LIMIT >= res.total);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchText, selectedBhk, selectedFurn, selectedRent],
  );

  React.useEffect(() => {
    setPage(1);
    setEndReached(false);
    void loadProperties(1, true);
  }, [searchText, selectedBhk, selectedFurn, selectedRent]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setPage(1);
    void loadProperties(1, true);
  }, [loadProperties]);

  const onEndReached = React.useCallback(() => {
    if (!endReached && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      void loadProperties(nextPage, false);
    }
  }, [endReached, loading, page, loadProperties]);

  return (
    <View style={styles.flex}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search city or locality…"
          placeholderTextColor={colors.textSec}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters */}
      <FilterBar
        filters={BHK_FILTERS}
        selected={selectedBhk}
        onFilterChange={setSelectedBhk}
        style={styles.filterBarPad}
      />
      <FilterBar
        filters={RENT_FILTERS}
        selected={selectedRent}
        onFilterChange={setSelectedRent}
        style={styles.filterBarPad}
      />
      <FilterBar
        filters={FURNISHING_FILTERS}
        selected={selectedFurn}
        onFilterChange={setSelectedFurn}
        style={styles.filterBarPad}
      />

      {/* Results */}
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? null : (
            <Banner variant="info">No properties found. Try different filters.</Banner>
          )
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : null
        }
        renderItem={({ item }) => {
          const primaryImg = item.images.find(i => i.isPrimary)?.url
            ?? item.images[0]?.url
            ?? null;
          return (
            <PropertyCard
              title={item.title}
              locality={item.locality}
              city={item.city}
              bhkType={item.bhkType}
              furnishingStatus={item.furnishingStatus}
              monthlyRentINR={Number(item.monthlyRentINR)}
              depositINR={Number(item.depositINR)}
              ownerName={item.ownerName}
              ownerScore={item.ownerScore}
              imageUrl={primaryImg}
              status={item.status}
              onPress={() => router.push(`/property/${item.id}`)}
              style={styles.card}
            />
          );
        }}
      />
    </View>
  );
}

// ─── My Properties View ───────────────────────────────────────────────────────

function MyPropertiesView(): React.ReactElement {
  const router = useRouter();
  const { state } = useAuth();
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading]       = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    try {
      // Search with no city filter returns all active — owners see their own via manage screen
      // For simplicity, load all ACTIVE listings owned by current user
      // (backend will filter by ownerId in future; for now load all)
      const res = await propertiesApi.search({ limit: 100 });
      const mine = res.data.filter(
        (p) => (p as Property & { ownerId?: string }).ownerId === state.user?.id,
      );
      setProperties(mine);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [state.user?.id]);

  React.useEffect(() => { void load(); }, []);

  return (
    <View style={styles.flex}>
      {loading && !refreshing && (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      )}
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListEmptyComponent={
          loading ? null : (
            <Banner variant="info">You haven't listed any properties yet. Tap + to add one.</Banner>
          )
        }
        renderItem={({ item }) => {
          const primaryImg = item.images.find(i => i.isPrimary)?.url
            ?? item.images[0]?.url
            ?? null;
          return (
            <PropertyCard
              title={item.title}
              locality={item.locality}
              city={item.city}
              bhkType={item.bhkType}
              furnishingStatus={item.furnishingStatus}
              monthlyRentINR={Number(item.monthlyRentINR)}
              depositINR={Number(item.depositINR)}
              ownerName={item.ownerName ?? state.user?.fullName ?? ''}
              ownerScore={item.ownerScore}
              imageUrl={primaryImg}
              status={item.status}
              onPress={() => router.push(`/my-properties/${item.id}`)}
              style={styles.card}
            />
          );
        }}
      />
      <FAB
        onPress={() => router.push('/my-properties/create')}
      />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function BrowseScreen(): React.ReactElement {
  const { state } = useAuth();
  const role = state.user?.role;

  const [tab, setTab] = React.useState<'browse' | 'mine'>('browse');

  if (role === UserRole.OWNER) {
    return <MyPropertiesView />;
  }

  if (role === UserRole.TENANT) {
    return <BrowseView />;
  }

  // BOTH — segmented control
  return (
    <View style={styles.flex}>
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, tab === 'browse' && styles.segmentActive]}
          onPress={() => setTab('browse')}
        >
          <Text style={[styles.segmentText, tab === 'browse' && styles.segmentTextActive]}>
            Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tab === 'mine' && styles.segmentActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.segmentText, tab === 'mine' && styles.segmentTextActive]}>
            My Properties
          </Text>
        </TouchableOpacity>
      </View>
      {tab === 'browse' ? <BrowseView /> : <MyPropertiesView />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    backgroundColor:  '#FFFFFF',
  },
  searchInput: {
    backgroundColor:   colors.surface,
    borderRadius:      borderRadius.md,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    fontSize:          fontSize.base,
    color:             colors.text,
  },
  filterBarPad: {
    paddingVertical: spacing.xs,
  },
  listContent: {
    padding:    spacing.base,
    gap:        spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing.sm,
  },
  loader: {
    marginVertical: spacing.base,
  },
  segmentRow: {
    flexDirection:     'row',
    margin:            spacing.base,
    borderRadius:      borderRadius.md,
    backgroundColor:   '#F3F4F6',
    padding:           3,
  },
  segment: {
    flex:              1,
    paddingVertical:   spacing.sm,
    borderRadius:      borderRadius.sm,
    alignItems:        'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    color:      colors.textSec,
  },
  segmentTextActive: {
    color:      colors.text,
    fontWeight: fontWeight.semibold,
  },
});
