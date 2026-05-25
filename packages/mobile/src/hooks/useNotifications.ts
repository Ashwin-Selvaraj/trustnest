import * as React from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  requestPermission: () => Promise<boolean>;
}

/**
 * Registers for push notifications and returns the Expo push token.
 * Call `requestPermission()` at an appropriate moment in the UX
 * (after first meaningful interaction, not on cold start).
 */
export function useNotifications(): UseNotificationsResult {
  const [expoPushToken, setExpoPushToken] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<Notifications.Notification | null>(null);

  React.useEffect(() => {
    const notifSub = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
    });
    return () => notifSub.remove();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TrustNest Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      setExpoPushToken(tokenData.data);
      return true;
    } catch {
      return false;
    }
  };

  return { expoPushToken, notification, requestPermission };
}
