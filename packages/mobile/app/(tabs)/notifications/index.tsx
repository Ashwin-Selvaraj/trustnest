import * as React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Banner, colors, spacing, fontSize, fontWeight, borderRadius } from '@trustnest/ui-kit';
import { NotificationType } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';
import { useNotifications } from '@/store/notifications.store';
import { SignInPrompt } from '../../../components/SignInPrompt';
import type { AppNotification } from '@/types/api';

const ICON_BY_TYPE: Record<NotificationType, string> = {
  [NotificationType.INTEREST_RECEIVED]: '🏠',
  [NotificationType.INTEREST_ACCEPTED]: '✅',
  [NotificationType.INTEREST_DECLINED]: '✕',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen(): React.ReactElement {
  const { state } = useAuth();
  const { notifications, loading, refresh, markRead, markAllRead, unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!state.isAuthenticated) {
    return (
      <SignInPrompt
        emoji="🔔"
        title="Stay in the loop"
        message="Sign in to get notified about agreement updates, payments, and tenant requests."
      />
    );
  }

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handlePress = (item: AppNotification): void => {
    if (!item.read) void markRead(item.id);
    if (item.data.propertyId) router.push(`/property/${item.data.propertyId}`);
  };

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.headerRow}>
          <Text style={styles.headerCount}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={() => void markAllRead()} hitSlop={8}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Banner variant="info">
                No notifications yet. You'll see updates here when tenants express interest or
                your agreements change status.
              </Banner>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{ICON_BY_TYPE[item.type] ?? '🔔'}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCount: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSec },
  markAllText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  listContent: { padding: spacing.base, gap: spacing.sm, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing['2xl'] },
  emptyEmoji: { fontSize: 48 },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  cardUnread: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  icon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  body: { fontSize: fontSize.sm, color: colors.textSec, lineHeight: 19 },
  time: { fontSize: fontSize.xs, color: colors.textSec, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4,
  },
});
