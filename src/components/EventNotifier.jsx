import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function EventNotifier({ children }) {
  const { profile } = useAuth();
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [notifiedEventIds, setNotifiedEventIds] = useState(new Set());

  useEffect(() => {
    if (!profile?.id || !isSupabaseConfigured) return;

    // Ask for notification permission if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const fetchTodaysEvents = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date_str', todayStr);

      if (data && !error) {
        setTodaysEvents(data);
      }
    };

    fetchTodaysEvents();

    // Re-fetch occasionally or let the user rely on fresh loads.
    // For this implementation, we will fetch once on mount/auth.
    const interval = setInterval(fetchTodaysEvents, 1000 * 60 * 15); // Refresh every 15m
    return () => clearInterval(interval);
  }, [profile?.id]);

  useEffect(() => {
    if (todaysEvents.length === 0) return;

    const checkEvents = () => {
      const now = new Date();
      // Format current time like "10:00 AM" to match time_str
      const timeStrNow = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/^0/, ''); // Remove leading zero if present, some browsers do this

      todaysEvents.forEach((ev) => {
        // Strip leading zeros for robust comparison
        const evTime = ev.time_str.replace(/^0/, '').toUpperCase();
        const nowTime = timeStrNow.toUpperCase();

        if (evTime === nowTime && !notifiedEventIds.has(ev.id)) {
          // Notify
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Relay Calendar: ${ev.title}`, {
              body: `Your scheduled ${ev.event_type.toLowerCase()} is starting now!`,
              icon: '/relay-icon-192.png'
            });
          } else {
            // Fallback in-app alert if permissions denied or not supported
            alert(`Relay Calendar: ${ev.title} is starting now!`);
          }

          // Mark as notified so we don't spam within the same minute
          setNotifiedEventIds((prev) => new Set(prev).add(ev.id));
        }
      });
    };

    // Check immediately, then every 30 seconds
    checkEvents();
    const interval = setInterval(checkEvents, 30000);
    return () => clearInterval(interval);
  }, [todaysEvents, notifiedEventIds]);

  return <>{children}</>;
}
