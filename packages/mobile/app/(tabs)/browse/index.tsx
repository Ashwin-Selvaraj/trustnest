import * as React from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '@/store/auth.store';
import {
  PropertyCard, FilterBar, Banner, FAB,
  colors, spacing, fontSize, fontWeight, borderRadius,
  BhkType, FurnishingStatus, PropertyStatus,
} from '@trustnest/ui-kit';
import { UserRole } from '@trustnest/shared';
import { propertiesApi } from '@/api/properties';
import type { Property } from '@/types/api';

// ─── Inline SVG icons for search bar ─────────────────────────────────────────

function SearchIcon(): React.ReactElement {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke={colors.textSec} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={colors.textSec} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ active }: { active: boolean }): React.ReactElement {
  const c = active ? colors.primary : colors.textSec;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M7 12h10M10 18h4" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

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

  const hasFilters = selectedBhk.length > 0 || selectedRent.length > 0 || selectedFurn.length > 0;
  const hasResults = properties.length > 0;
  const isFiltered = hasFilters || searchText.trim().length > 0;

  return (
    <View style={styles.flex}>
      {/* Premium search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconWrap}><SearchIcon /></View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or locality…"
            placeholderTextColor={colors.textSec}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={() => setSearchText('')} hitSlop={8}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterIconBtn, hasFilters && styles.filterIconBtnActive]}
          onPress={() => {
            // Toggle all filters off when active, otherwise show BHK filter
            if (hasFilters) {
              setSelectedBhk([]);
              setSelectedRent([]);
              setSelectedFurn([]);
            }
          }}
          activeOpacity={0.75}
        >
          <FilterIcon active={hasFilters} />
        </TouchableOpacity>
      </View>

      {/* Filters — only shown when there are results or active filters */}
      {(hasResults || hasFilters) && (
        <>
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
        </>
      )}

      {/* Results */}
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          !hasResults && styles.listContentEmpty,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : isFiltered ? (
            /* Empty state — no results from filters */
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySubtitle}>
                Try different filters or search in a nearby city.
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => {
                  setSearchText('');
                  setSelectedBhk([]);
                  setSelectedRent([]);
                  setSelectedFurn([]);
                }}
              >
                <Text style={styles.emptyActionText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Empty state — no data at all */
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptySubtitle}>
                Properties listed on TrustNest will appear here.{'\n'}Check back soon!
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && !refreshing && hasResults ? (
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
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    backgroundColor:   '#FFFFFF',
    gap:               spacing.sm,
  },
  searchBar: {
    flex:              1,
    height:            44,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.surface,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       colors.border,
    paddingHorizontal: spacing.sm,
    gap:               spacing.xs,
  },
  searchIconWrap: { paddingHorizontal: 2 },
  searchInput: {
    flex:     1,
    height:   44,
    fontSize: fontSize.base,
    color:    colors.text,
    padding:  0,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize:   fontSize.sm,
    color:      colors.textSec,
    fontWeight: fontWeight.medium,
  },
  filterIconBtn: {
    width:           44,
    height:          44,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     colors.border,
    backgroundColor: colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  filterIconBtnActive: {
    borderColor:     colors.primary,
    backgroundColor: colors.primaryLight,
  },
  filterBarPad: {
    paddingVertical: spacing.xs,
  },
  listContent: {
    padding:    spacing.base,
    gap:        spacing.md,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  card: {
    marginBottom: spacing.sm,
  },
  loader: {
    marginVertical: spacing.base,
  },
  emptyState: {
    flex:          1,
    alignItems:    'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap:           spacing.sm,
  },
  emptyEmoji: { fontSize: 52, marginBottom: spacing.xs },
  emptyTitle: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
    color:      colors.text,
    textAlign:  'center',
  },
  emptySubtitle: {
    fontSize:   fontSize.base,
    color:      colors.textSec,
    textAlign:  'center',
    lineHeight: 22,
  },
  emptyAction: {
    marginTop:       spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:    borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  emptyActionText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.primary,
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
