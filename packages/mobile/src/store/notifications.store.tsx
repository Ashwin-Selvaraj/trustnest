/**
 * NotificationsProvider — lightweight polling store for in-app notifications.
 *
 * Polls GET /notifications every 30s while a session is active (no push
 * infra yet — see docs/phase1-tasks.md §12e.F). Feeds the header bell badge
 * and the Alerts tab from a single source so counts stay consistent.
 */
import * as React from 'react';
import { notificationsApi } from '../api/notifications';
import { useAuth } from './auth.store';
import type { AppNotification } from '../types/api';

const POLL_INTERVAL_MS = 30_000;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { state } = useAuth();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!state.isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // silent — polling, don't spam the user with errors
    } finally {
      setLoading(false);
    }
  }, [state.isAuthenticated]);

  React.useEffect(() => {
    if (!state.isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, refresh]);

  const markRead = async (id: string): Promise<void> => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      void refresh();
    }
  };

  const markAllRead = async (): Promise<void> => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      void refresh();
    }
  };

  const value: NotificationsContextValue = {
    notifications, unreadCount, loading, refresh, markRead, markAllRead,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
