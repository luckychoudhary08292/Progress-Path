// Task Reminder Notification Manager for PWA & Web Mobile
// Supports custom user intervals, 1-hour default, Web Audio chimes, and PWA Service Worker notifications.

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
export function playChimeSound(): void {
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

// Notification History Storage & Events
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
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, 50))); // Keep last 50
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT, { detail: items }));
  } catch {
    // ignore
  }
}

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
  return newItem;
}

export function markNotificationAsRead(id: string): void {
  const current = getNotificationHistory();
  const updated = current.map((item) => (item.id === id ? { ...item, read: true } : item));
  saveNotificationHistory(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getNotificationHistory();
  const updated = current.map((item) => ({ ...item, read: true }));
  saveNotificationHistory(updated);
}

export function clearNotificationHistory(): void {
  saveNotificationHistory([]);
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

// Deliver native device / PWA notification for pending daily tasks
export async function deliverTaskReminderNotification(options: {
  pendingCount: number;
  taskTitles: string[];
  isTest?: boolean;
}): Promise<boolean> {
  const { pendingCount, taskTitles, isTest = false } = options;
  const settings = getTaskReminderSettings();

  // If not a test and notifications are disabled, bail out
  if (!isTest && !settings.enabled) {
    return false;
  }

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

  // Always record in Notification History for in-app drawer visibility
  addNotificationHistoryItem({
    title,
    body,
    type: isTest ? 'system' : 'task-reminder',
  });

  const permission = getNotificationPermissionStatus();
  if (permission !== 'granted') {
    return false;
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

  try {
    // Try service worker registration first (optimal for PWA mobile background alerts)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        updateLastNotifiedTimestamp();
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
      updateLastNotifiedTimestamp();
      return true;
    }
  } catch (err) {
    console.warn('[TaskReminders] Failed to show notification:', err);
  }

  return false;
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
