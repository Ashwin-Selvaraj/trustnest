import * as React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  AgreementCard, Banner, FAB,
  colors, spacing, fontSize, fontWeight,
} from '@trustnest/ui-kit';
import { UserRole } from '@trustnest/shared';
import { useAgreements } from '@/hooks/useAgreements';
import { useAuth } from '@/store/auth.store';
import type { Agreement } from '@/types/api';

export default function HomeScreen(): React.ReactElement {
  const { state } = useAuth();
  const { agreements, isLoading, error, refresh, loadMore } = useAgreements();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const viewerRole = state.user?.role ?? UserRole.TENANT;

  const renderItem = ({ item }: { item: Agreement }): React.ReactElement => (
    <AgreementCard
      id={item.id}
      propertyAddress={item.propertyAddress}
      status={item.status}
      rentINR={item.rentINR}
      depositINR={item.depositINR}
      tenantName={item.tenantName}
      ownerName={item.ownerName}
      startDate={item.startDate}
      endDate={item.endDate}
      viewerRole={viewerRole}
      onPress={() => router.push(`/agreement/${item.id}`)}
      style={styles.card}
    />
  );

  const ListEmpty = (): React.ReactElement => {
    if (isLoading) return <></>;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>No agreements yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first rental agreement to get started.
        </Text>
        <Banner variant="info">
          Tap the + button below or browse properties in the Discover tab.
        </Banner>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => void refresh()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={agreements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<ListEmpty />}
        ListHeaderComponent={
          isLoading && agreements.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
      />

      <FAB onPress={() => router.push('/agreement/create')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.surface },
  list: {
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.base,
    paddingBottom:     100,
    flexGrow: 1,
  },
  card:       { marginBottom: spacing.sm },
  loader:     { marginTop: spacing.xl },
  centeredContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  errorText:  { color: colors.danger, fontSize: fontSize.base, textAlign: 'center', marginBottom: spacing.sm },
  retryText:  { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop:       spacing['2xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji:    { fontSize: 56 },
  emptyTitle: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.bold,
    color:      colors.text,
  },
  emptySubtitle: {
    fontSize:  fontSize.base,
    color:     colors.textSec,
    textAlign: 'center',
    lineHeight: 22,
  },
});
