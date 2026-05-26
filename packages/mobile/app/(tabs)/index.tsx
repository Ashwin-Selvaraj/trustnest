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
import { AgreementCard, Button } from '@trustnest/ui-kit';
import { UserRole } from '@trustnest/shared';
import { useAgreements } from '@/hooks/useAgreements';
import { useAuth } from '@/store/auth.store';
import type { Agreement } from '@/types/api';

/**
 * Home screen — shows the authenticated user's agreements list.
 */
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
        <Button
          variant="primary"
          onPress={() => router.push('/agreement/create')}
          style={styles.emptyButton}
        >Create Agreement</Button>
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
            <ActivityIndicator color="#2563EB" style={styles.loader} />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor="#2563EB" />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/agreement/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 34,
    marginTop: -2,
  },
});
