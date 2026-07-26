import { supabase } from './supabaseClient';

// Helper to convert base64 url string to Uint8Array for the push manager
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const PushService = {
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  getPermissionState: async () => {
    if (!PushService.isSupported()) return 'denied';
    return Notification.permission; // 'default', 'granted', 'denied'
  },

  subscribeToPush: async (userId) => {
    if (!PushService.isSupported()) {
      throw new Error("Push notifications not supported in this browser.");
    }

    try {
      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error("Permission not granted for Notification");
      }

      // 2. Get Service Worker Registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to Push Manager
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("VAPID public key missing from environment");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 4. Save subscription to Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          subscription: subscription.toJSON()
        });

      if (error) {
        // If it already exists (UNIQUE constraint violation), it's fine
        if (error.code !== '23505') {
          throw error;
        }
      }

      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      throw error;
    }
  },

  unsubscribeFromPush: async (userId) => {
    if (!PushService.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Remove from DB first
        await supabase
          .from('push_subscriptions')
          .delete()
          .match({ 
            user_id: userId,
            subscription: subscription.toJSON() 
          });

        // Unsubscribe from browser
        const successful = await subscription.unsubscribe();
        return successful;
      }
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      throw error;
    }
  },

  checkIsSubscribed: async () => {
    if (!PushService.isSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  }
};
