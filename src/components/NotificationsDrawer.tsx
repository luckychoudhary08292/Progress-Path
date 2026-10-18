import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  getNotificationHistory,
  subscribeToNotificationHistory,
  markNotificationAsRead,
  clearNotificationHistory,
  NotificationHistoryItem,
} from '../utils/taskNotificationManager.ts';
import { TodayEvent } from '../types.ts';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  onNavigateToCalendar?: () => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
}: NotificationsDrawerProps) {
  const [historyItems, setHistoryItems] = useState<NotificationHistoryItem[]>(getNotificationHistory);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [togglingEventIds, setTogglingEventIds] = useState<Set<string>>(new Set());

  // Subscribe to notification history
  useEffect(() => {
    return subscribeToNotificationHistory((updated) => {
      setHistoryItems(updated);
    });
  }, []);

  // Fetch today's tasks
  const fetchTodayTasks = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;

    setIsLoadingEvents(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/calendar/events?date=${todayStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTodayEvents(data.events || []);
      }
    } catch (err) {
      console.warn('[NotificationsDrawer] Error loading tasks:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Refresh tasks on drawer open and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      fetchTodayTasks();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fetchTodayTasks]);

  // Mobile hardware & browser back button handling (popstate)
  useEffect(() => {
    if (!isOpen) return;

    const stateKey = 'notif_drawer_' + Date.now();
    let isClosedViaPopState = false;

    // Push state so Android/iOS back button or swipe-back closes the drawer
    window.history.pushState({ modal: 'notifications', key: stateKey }, '');

    const handlePopState = () => {
      isClosedViaPopState = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If user closed drawer via on-screen buttons (X, Back Arrow, or Backdrop)
      // and not by physical back button, pop the state to keep history pristine
      if (!isClosedViaPopState && window.history.state?.key === stateKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle task status
  const handleToggleTask = async (event: TodayEvent) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token || togglingEventIds.has(event.id)) return;

    const nextCompleted = !event.completed;

    // Optimistic UI update
    setTodayEvents((prev) =>
      prev.map((item) => (item.id === event.id ? { ...item, completed: nextCompleted } : item))
    );

    setTogglingEventIds((prev) => new Set(prev).add(event.id));

    try {
      const res = await fetch(`/api/calendar/events/${event.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        fetchTodayTasks();
      } else {
        window.dispatchEvent(
          new CustomEvent('progresspath_event_toggled', {
            detail: { id: event.id, completed: nextCompleted },
          })
        );
      }
    } catch {
      fetchTodayTasks();
    } finally {
      setTogglingEventIds((prev) => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
    }
  };

  // Clear all notifications action
  const handleClear = () => {
    clearNotificationHistory();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const hasItems = historyItems.length > 0 || todayEvents.length > 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        id="notification-drawer-backdrop"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      />

      {/* Slide-over Drawer: Clean, Simple, Aesthetic, Mobile Responsive */}
      <aside
        id="notifications-slide-drawer"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white dark:bg-zinc-900 border-l border-slate-200/80 dark:border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Clean & Simple */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile Screen Back Button */}
            <button
              type="button"
              id="drawer-mobile-back-btn"
              onClick={onClose}
              className="sm:hidden -ml-1 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Notifications
            </h2>
          </div>

          {/* Close button */}
          <button
            type="button"
            id="drawer-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close notifications"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Button Bar right below header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-850/40 shrink-0">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {historyItems.length + todayEvents.length > 0
              ? `${historyItems.length + todayEvents.length} items`
              : 'All clear'}
          </span>

          <button
            type="button"
            id="drawer-clear-btn"
            onClick={handleClear}
            disabled={historyItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear all notification history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoadingEvents && todayEvents.length === 0 && historyItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : !hasItems ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-zinc-500 border border-slate-100 dark:border-zinc-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                No notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                You're all caught up with your daily schedule and routine reminders.
              </p>
            </div>
          ) : (
            <>
              {/* Today's Tasks */}
              {todayEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 pt-1">
                    Today's Schedule
                  </div>
                  {todayEvents.map((event) => {
                    const isToggling = togglingEventIds.has(event.id);
                    return (
                      <div
                        key={event.id}
                        id={`drawer-task-item-${event.id}`}
                        className={`p-3 rounded-xl border transition-all ${
                          event.completed
                            ? 'bg-slate-50/60 dark:bg-zinc-850/40 border-slate-100 dark:border-zinc-800/80 opacity-60'
                            : 'bg-white dark:bg-zinc-850 border-slate-200/90 dark:border-zinc-750 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700/60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            id={`drawer-toggle-task-${event.id}`}
                            onClick={() => handleToggleTask(event)}
                            disabled={isToggling}
                            className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 transition-colors focus:outline-none cursor-pointer"
                            title={event.completed ? 'Mark pending' : 'Mark completed'}
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : event.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 hover:fill-blue-50 dark:hover:fill-blue-950" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-xs font-semibold leading-snug break-words ${
                                event.completed
                                  ? 'line-through text-slate-400 dark:text-zinc-500'
                                  : 'text-slate-900 dark:text-zinc-100'
                              }`}
                            >
                              {event.title}
                            </span>

                            {!event.completed && (
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Pending routine reminder</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Notification History Logs */}
              {historyItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Activity &amp; Alerts
                  </div>
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      id={`drawer-alert-item-${item.id}`}
                      onClick={() => markNotificationAsRead(item.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        item.read
                          ? 'bg-slate-50/50 dark:bg-zinc-850/40 border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400'
                          : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 text-slate-900 dark:text-zinc-100 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            item.read
                              ? 'bg-slate-200/70 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                              : 'bg-blue-600 text-white shadow-2xs'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold leading-tight truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
