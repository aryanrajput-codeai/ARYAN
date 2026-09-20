import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for Expo Push Notifications and obtain the Expo push token.
 * Saves the token to Supabase for the authenticated user so edge functions
 * or cron jobs can dispatch renewal and payment alerts.
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  let token: string | null = null;

  try {
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('webrajya-alerts', {
        name: 'WebRajya Subscriptions & Renewals',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    // Obtain Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'webrajya-subscription-manager',
    });
    token = tokenData.data;

    // Persist token to Supabase if authenticated
    if (token && userId) {
      await savePushTokenToSupabase(userId, token);
    }

    return token;
  } catch (error) {
    console.log('Push notification registration notice:', error);
    return null;
  }
}

/**
 * Persist device push token to user_profiles in Supabase
 */
async function savePushTokenToSupabase(userId: string, pushToken: string) {
  try {
    // Attempt updating user profile with device token if table/column exists
    await supabase
      .from('user_profiles')
      .update({
        push_token: pushToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (err) {
    // Non-blocking if table schema doesn't have push_token yet
    console.log('Push token synchronization notice:', err);
  }
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (tapped on notification)
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
