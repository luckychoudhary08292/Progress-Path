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
  const isCheckingRef = useRef<boolean>(false);

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
    if (isCheckingRef.current) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return; // Only notify if user is authenticated

    const currentSettings = getTaskReminderSettings();
    if (!currentSettings.enabled) return;

    // Check interval elapsed with a minimum of 5 minutes protection
    const now = Date.now();
    const intervalMinutes = Math.max(5, currentSettings.intervalMinutes || 60);
    const intervalMs = intervalMinutes * 60 * 1000;
    const lastNotified = currentSettings.lastNotifiedAt || 0;

    if (lastNotified > 0 && now - lastNotified < intervalMs) {
      return; // Still within routine interval
    }

    isCheckingRef.current = true;

    try {
      let pendingList: { id: string; title: string }[] = [];

      // Use current events if passed, otherwise fetch today's events from API
      if (eventsRef.current && eventsRef.current.length > 0) {
        pendingList = eventsRef.current.filter((e) => !e.completed).map((e) => ({ id: e.id, title: e.title }));
      } else {
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
      }

      setPendingTasksCount(pendingList.length);

      // CRITICAL USER RULE: Only notify if there are pending tasks!
      if (pendingList.length > 0) {
        await deliverTaskReminderNotification({
          pendingCount: pendingList.length,
          taskTitles: pendingList.map((t) => t.title),
        });
      }
    } catch (err) {
      console.warn('[TaskReminderScheduler] Error checking pending tasks:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Periodic scheduler loop (checks once every 60 seconds with 10s initial delay)
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      checkAndNotify();
    }, 10000);

    const intervalTimer = setInterval(() => {
      checkAndNotify();
    }, 60000); // 60 seconds check loop

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
