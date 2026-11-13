// Task Reminder Notification Manager for PWA & Web Mobile
// Supports custom user intervals, 1-hour default, Web Audio chimes, PWA Service Worker notifications,
// and database persistence for user profile notifications.

export interface TaskReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // Default is 60 (1 hour)
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  lastNotifiedAt: number | null;
}

export const DEFAULT_REMINDER_SETTINGS: TaskReminderSettings = {
  enabled: true,
  intervalMinutes: 60, // 1 hour default
  soundEnabled: true,
  vibrateEnabled: true,
  lastNotifiedAt: null,
};

const STORAGE_KEY = 'progresspath_task_reminder_settings';
const SETTINGS_CHANGE_EVENT = 'progresspath_reminder_settings_updated';

// Retrieve settings from localStorage with fallback to default (1 hour)
export function getTaskReminderSettings(): TaskReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_REMINDER_SETTINGS.enabled,
      intervalMinutes: Number(parsed.intervalMinutes) > 0 ? Number(parsed.intervalMinutes) : 60,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      vibrateEnabled: typeof parsed.vibrateEnabled === 'boolean' ? parsed.vibrateEnabled : true,
      lastNotifiedAt: parsed.lastNotifiedAt ? Number(parsed.lastNotifiedAt) : null,
    };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

// Save settings to localStorage and notify listeners
export function saveTaskReminderSettings(updates: Partial<TaskReminderSettings>): TaskReminderSettings {
  const current = getTaskReminderSettings();
  const next: TaskReminderSettings = {
    ...current,
    ...updates,
    intervalMinutes: updates.intervalMinutes !== undefined ? Math.max(5, updates.intervalMinutes) : current.intervalMinutes,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: next }));
    } catch {
      // ignore storage failure
    }
  }

  return next;
}

// Reset settings explicitly to default (1 Hour)
export function resetToDefaultTaskReminderSettings(): TaskReminderSettings {
  return saveTaskReminderSettings({
    enabled: true,
    intervalMinutes: 60, // 1 hour default
    soundEnabled: true,
    vibrateEnabled: true,
  });
}

// Check current Notification permission status
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request Notification permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[TaskReminders] Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Play a pleasant, lightweight notification chime using Web Audio API (zero external assets needed)
let lastChimePlayedAt = 0;
export function playChimeSound(): void {
  const nowMs = Date.now();
  // Prevent chime spam: minimum 5s between audible sounds
  if (nowMs - lastChimePlayedAt < 5000) return;
  lastChimePlayedAt = nowMs;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone (E5 ~ 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonious tone (B5 ~ 987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.14, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Audio context may be blocked by autoplay policies until user gesture
  }
}

// Trigger device vibration if supported and enabled
export function triggerVibration(): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------------
// Notification History Storage & DB Integration
// -----------------------------------------------------------------------------

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'task-reminder' | 'task-completed' | 'system';
  read: boolean;
  taskId?: string;
}

const HISTORY_STORAGE_KEY = 'progresspath_notification_history';
const HISTORY_CHANGE_EVENT = 'progresspath_notification_history_updated';

export function getNotificationHistory(): NotificationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotificationHistory(items: NotificationHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, 100))); // Keep last 100
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT, { detail: items }));
  } catch {
    // ignore
  }
}

// Fetch user notifications from database API
export async function syncNotificationsFromDb(): Promise<NotificationHistoryItem[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return getNotificationHistory();

  try {
    const res = await fetch('/api/notifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const dbItems: NotificationHistoryItem[] = (data.notifications || []).map((n: any) => ({
        id: n.id || n._id,
        title: n.title,
        body: n.body,
        timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : Date.now()),
        type: n.type || 'task-reminder',
        read: !!n.read,
      }));

      saveNotificationHistory(dbItems);
      return dbItems;
    }
  } catch (err) {
    console.warn('[taskNotificationManager] Failed to sync notifications from DB:', err);
  }

  return getNotificationHistory();
}

// Add notification item: updates local UI instantly and saves to database
export function addNotificationHistoryItem(
  item: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'>
): NotificationHistoryItem {
  const current = getNotificationHistory();
  const newItem: NotificationHistoryItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    read: false,
    ...item,
  };

  saveNotificationHistory([newItem, ...current]);

  // Persist to Database asynchronously for this user profile
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newItem.title,
        body: newItem.body,
        type: newItem.type,
      }),
    }).then(async (res) => {
      if (res.ok) {
        const saved = await res.json();
        // Replace temp id with saved DB id
        if (saved && saved.id) {
          const fresh = getNotificationHistory();
          const mapped = fresh.map((f) => (f.id === newItem.id ? { ...f, id: saved.id } : f));
          saveNotificationHistory(mapped);
        }
      }
    }).catch((err) => {
      console.warn('[taskNotificationManager] DB notification save notice:', err);
    });
  }

  return newItem;
}

export function markNotificationAsRead(id: string): void {
  const current = getNotificationHistory();
  const updated = current.map((item) => (item.id === id ? { ...item, read: true } : item));
  saveNotificationHistory(updated);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

export function markAllNotificationsAsRead(): void {
  const current = getNotificationHistory();
  const updated = current.map((item) => ({ ...item, read: true }));
  saveNotificationHistory(updated);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

// CRITICAL USER REQUIREMENT:
// Clears ONLY the notification messages of this user profile from the database.
// Strictly DOES NOT modify, reset, or touch any task marking, events, or completion status!
export async function clearNotificationHistory(): Promise<void> {
  // Wipe local notification history state
  saveNotificationHistory([]);

  // Wipe all notification messages of this user profile from DB
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    try {
      await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.warn('[taskNotificationManager] Error clearing notifications from DB:', err);
    }
  }
}

export function subscribeToNotificationHistory(
  callback: (items: NotificationHistoryItem[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<NotificationHistoryItem[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getNotificationHistory());
    }
  };

  window.addEventListener(HISTORY_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(HISTORY_CHANGE_EVENT, handler);
  };
}

// -----------------------------------------------------------------------------
// Deliver native device / PWA notification for pending daily tasks
// -----------------------------------------------------------------------------

let inMemoryLastDeliveredAt = 0;
let isDeliveringLock = false;

export async function deliverTaskReminderNotification(options: {
  pendingCount: number;
  taskTitles: string[];
  isTest?: boolean;
}): Promise<boolean> {
  const { pendingCount, taskTitles, isTest = false } = options;

  // Anti-loop mutex lock: prevent concurrent or re-entrant executions
  if (isDeliveringLock) return false;

  const nowMs = Date.now();
  const settings = getTaskReminderSettings();

  // If not a test and notifications are disabled, bail out
  if (!isTest && !settings.enabled) {
    return false;
  }

  // HARD COOLDOWN: Never fire twice within 60 seconds under any circumstance
  if (!isTest && nowMs - inMemoryLastDeliveredAt < 60000) {
    return false;
  }

  // Interval verification
  const intervalMs = settings.intervalMinutes * 60 * 1000;
  if (!isTest && settings.lastNotifiedAt && nowMs - settings.lastNotifiedAt < intervalMs) {
    return false;
  }

  isDeliveringLock = true;
  inMemoryLastDeliveredAt = nowMs;

  // CRITICAL: Update last notified timestamp immediately to prevent re-triggering loops!
  updateLastNotifiedTimestamp();

  try {
    // Play audio chime if enabled
    if (settings.soundEnabled) {
      playChimeSound();
    }

    // Trigger vibration pattern if enabled
    if (settings.vibrateEnabled) {
      triggerVibration();
    }

    const title = isTest
      ? '🔔 Task Reminder Test: ProgressPath'
      : `⏰ ${pendingCount} Pending Task${pendingCount > 1 ? 's' : ''} Today`;

    const primaryTask = taskTitles[0] || 'Scheduled task';
    const remainingText = taskTitles.length > 1 ? ` and ${taskTitles.length - 1} more` : '';

    const body = isTest
      ? `Notifications are working! You'll receive routine alerts every ${formatInterval(settings.intervalMinutes)} for pending tasks.`
      : `"${primaryTask}"${remainingText} is still pending. Tap to mark complete!`;

    // Store in Notification History and Database for in-app drawer visibility
    addNotificationHistoryItem({
      title,
      body,
      type: isTest ? 'system' : 'task-reminder',
    });

    const permission = getNotificationPermissionStatus();
    if (permission !== 'granted') {
      return true; // Notification delivered to in-app drawer and sound/vibe played
    }

    const notificationOptions = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/system_logo.svg',
      tag: 'progresspath-task-reminder',
      renotify: true,
      data: {
        url: '/',
        type: 'task-reminder',
      },
    } as NotificationOptions;

    // Try service worker registration first (optimal for PWA mobile background alerts)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback to standard window Notification
    if ('Notification' in window) {
      const n = new Notification(title, notificationOptions);
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    }

    return true;
  } catch (err) {
    console.warn('[TaskReminders] Error delivering notification:', err);
    return false;
  } finally {
    isDeliveringLock = false;
  }
}

// Update last notification timestamp
export function updateLastNotifiedTimestamp(): void {
  saveTaskReminderSettings({ lastNotifiedAt: Date.now() });
}

// Helper to format interval minutes into human-readable text
export function formatInterval(minutes: number): string {
  if (minutes === 60) return '1 hour (Default)';
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes % 60 === 0) {
    const hrs = minutes / 60;
    return `${hrs} hour${hrs > 1 ? 's' : ''}`;
  }
  const hrs = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hrs}h ${remMin}m`;
}

// Subscribe to settings change events
export function subscribeToReminderSettings(callback: (settings: TaskReminderSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<TaskReminderSettings>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getTaskReminderSettings());
    }
  };

  window.addEventListener(SETTINGS_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(SETTINGS_CHANGE_EVENT, handler);
  };
}
