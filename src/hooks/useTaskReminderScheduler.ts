import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  getTaskReminderSettings, 
  deliverTaskReminderNotification, 
  subscribeToReminderSettings,
  TaskReminderSettings
} from '../utils/taskNotificationManager';
import { TodayEvent } from '../types';

export function useTaskReminderScheduler(events?: TodayEvent[]) {
  const [settings, setSettings] = useState<TaskReminderSettings>(getTaskReminderSettings);
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);
  const eventsRef = useRef<TodayEvent[] | undefined>(events);
  eventsRef.current = events;

  // Listen to settings updates
  useEffect(() => {
    return subscribeToReminderSettings((updated) => {
      setSettings(updated);
    });
  }, []);

  // Update pending tasks count whenever events prop changes
  useEffect(() => {
    if (events) {
      const pending = events.filter((e) => !e.completed);
      setPendingTasksCount(pending.length);
    }
  }, [events]);

  const checkAndNotify = useCallback(async () => {
    const currentSettings = getTaskReminderSettings();
    if (!currentSettings.enabled) return;

    // Check interval elapsed
    const now = Date.now();
    const intervalMs = currentSettings.intervalMinutes * 60 * 1000;
    const lastNotified = currentSettings.lastNotifiedAt || 0;

    if (now - lastNotified < intervalMs) {
      return; // Still waiting for the interval (e.g. 1 hour)
    }

    let pendingList: { id: string; title: string }[] = [];

    // Use current events if passed, otherwise fetch today's events from API
    if (eventsRef.current && eventsRef.current.length > 0) {
      pendingList = eventsRef.current.filter((e) => !e.completed).map((e) => ({ id: e.id, title: e.title }));
    } else {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/calendar/events?date=${todayStr}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items: TodayEvent[] = data.events || [];
          pendingList = items.filter((e) => !e.completed).map((e) => ({ id: e.id, title: e.title }));
        }
      } catch (err) {
        console.warn('[TaskReminderScheduler] Error checking calendar events:', err);
      }
    }

    setPendingTasksCount(pendingList.length);

    // CRITICAL USER RULE: Only notify if there are pending tasks!
    // "until and unless it will not done"
    if (pendingList.length > 0) {
      await deliverTaskReminderNotification({
        pendingCount: pendingList.length,
        taskTitles: pendingList.map((t) => t.title),
      });
    }
  }, []);

  // Periodic scheduler loop (checks every 30 seconds)
  useEffect(() => {
    // Initial check after 3 seconds of mount
    const initialTimer = setTimeout(() => {
      checkAndNotify();
    }, 3000);

    const intervalTimer = setInterval(() => {
      checkAndNotify();
    }, 30000); // 30 seconds check

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [checkAndNotify]);

  return {
    settings,
    pendingTasksCount,
    checkAndNotify,
  };
}
