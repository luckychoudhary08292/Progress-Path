import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  ArrowLeft,
  Trash2,
  Sparkles,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import {
  getNotificationHistory,
  subscribeToNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotificationHistory,
  syncNotificationsFromDb,
  NotificationHistoryItem,
} from '../utils/taskNotificationManager.ts';
import { NotificationsDrawerSkeleton } from './Skeleton.tsx';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Subscribe to notification history changes
  useEffect(() => {
    return subscribeToNotificationHistory((updated) => {
      setHistoryItems(updated);
    });
  }, []);

  // Sync notifications from Database when drawer opens
  const refreshFromDb = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await syncNotificationsFromDb();
      setHistoryItems(items);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshFromDb();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, refreshFromDb]);

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

  // CRITICAL USER REQUIREMENT:
  // Clear all notification messages of this user profile from the database.
  // Never unmarks or modifies any tasks!
  const handleClear = async () => {
    if (historyItems.length === 0 || isClearing) return;
    setIsClearing(true);
    try {
      await clearNotificationHistory();
      setHistoryItems([]);
    } finally {
      setIsClearing(false);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = historyItems.filter((i) => !i.read).length;

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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
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

        {/* Action Bar right below header - with Clear Button */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-850/40 shrink-0">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {historyItems.length > 0 ? `${historyItems.length} notification${historyItems.length > 1 ? 's' : ''}` : 'All clear'}
          </span>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                id="drawer-mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Mark read</span>
              </button>
            )}

            <button
              type="button"
              id="drawer-clear-btn"
              onClick={handleClear}
              disabled={historyItems.length === 0 || isClearing}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear all notification messages from database"
            >
              {isClearing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body - Exclusively Notification Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading && historyItems.length === 0 ? (
            <NotificationsDrawerSkeleton />
          ) : historyItems.length === 0 ? (
            <div className="py-20 text-center">
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
            <div className="space-y-2.5">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  id={`drawer-alert-item-${item.id}`}
                  onClick={() => markNotificationAsRead(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    item.read
                      ? 'bg-slate-50/50 dark:bg-zinc-850/40 border-slate-100 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60'
                      : 'bg-blue-50/40 dark:bg-blue-950/25 border-blue-200/80 dark:border-blue-900/50 text-slate-900 dark:text-zinc-100 shadow-2xs hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
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
                        <span className={`text-xs leading-tight truncate ${item.read ? 'font-medium' : 'font-bold'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed break-words">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
