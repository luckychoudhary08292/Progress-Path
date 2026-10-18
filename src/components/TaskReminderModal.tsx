import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import {
  getTaskReminderSettings,
  saveTaskReminderSettings,
  resetToDefaultTaskReminderSettings,
  TaskReminderSettings,
} from '../utils/taskNotificationManager';

interface TaskReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTasksCount?: number;
}

function formatTotalPreview(hrsStr: string, minsStr: string): string {
  const h = parseInt(hrsStr, 10) || 0;
  const m = parseInt(minsStr, 10) || 0;
  const total = h * 60 + m;
  if (total <= 0) return '0 min (min 5 min)';
  if (total < 5) return `${total} min (min 5 min)`;
  const actualH = Math.floor(total / 60);
  const actualM = total % 60;
  if (actualH === 0) return `${actualM} minutes`;
  if (actualM === 0) return `${actualH} hour${actualH > 1 ? 's' : ''}`;
  return `${actualH} hr${actualH > 1 ? 's' : ''} ${actualM} min`;
}

export function TaskReminderModal({ isOpen, onClose }: TaskReminderModalProps) {
  const [settings, setSettings] = useState<TaskReminderSettings>(getTaskReminderSettings);
  const [selectedOption, setSelectedOption] = useState<string>('60');
  const [customHours, setCustomHours] = useState<string>('0');
  const [customMinutes, setCustomMinutes] = useState<string>('45');

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      const current = getTaskReminderSettings();
      setSettings(current);

      const hrs = Math.floor(current.intervalMinutes / 60);
      const mins = current.intervalMinutes % 60;
      setCustomHours(String(hrs));
      setCustomMinutes(String(mins));

      if ([30, 60, 120, 180].includes(current.intervalMinutes)) {
        setSelectedOption(String(current.intervalMinutes));
      } else {
        setSelectedOption('custom');
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggle = () => {
    const next = saveTaskReminderSettings({ enabled: !settings.enabled });
    setSettings(next);
  };

  const applyCustomInterval = (hrsVal: string, minsVal: string) => {
    const h = parseInt(hrsVal, 10);
    const m = parseInt(minsVal, 10);
    const safeH = isNaN(h) || h < 0 ? 0 : Math.min(24, h);
    const safeM = isNaN(m) || m < 0 ? 0 : Math.min(59, m);
    const total = safeH * 60 + safeM;
    if (total >= 5) {
      const next = saveTaskReminderSettings({ intervalMinutes: Math.min(1440, total) });
      setSettings(next);
    }
  };

  const handleSelectChange = (value: string) => {
    setSelectedOption(value);
    if (value === '60') {
      const next = resetToDefaultTaskReminderSettings();
      setSettings(next);
      setCustomHours('1');
      setCustomMinutes('0');
    } else if (value !== 'custom') {
      const mins = parseInt(value, 10);
      const next = saveTaskReminderSettings({ intervalMinutes: mins });
      setSettings(next);
      setCustomHours(String(Math.floor(mins / 60)));
      setCustomMinutes(String(mins % 60));
    } else {
      const h = parseInt(customHours, 10) || 0;
      const m = parseInt(customMinutes, 10) || 0;
      const total = Math.max(5, Math.min(1440, h * 60 + m));
      const next = saveTaskReminderSettings({ intervalMinutes: total });
      setSettings(next);
    }
  };

  const handleCustomHoursChange = (valStr: string) => {
    const cleaned = valStr === '' ? '' : String(Math.max(0, Math.min(24, parseInt(valStr, 10) || 0)));
    setCustomHours(cleaned);
    applyCustomInterval(cleaned, customMinutes);
  };

  const handleCustomMinutesChange = (valStr: string) => {
    const cleaned = valStr === '' ? '' : String(Math.max(0, Math.min(59, parseInt(valStr, 10) || 0)));
    setCustomMinutes(cleaned);
    applyCustomInterval(customHours, cleaned);
  };

  const handleDone = () => {
    if (selectedOption === 'custom') {
      const h = parseInt(customHours, 10) || 0;
      const m = parseInt(customMinutes, 10) || 0;
      const total = Math.max(5, Math.min(1440, h * 60 + m));
      saveTaskReminderSettings({ intervalMinutes: total });
    }
    onClose();
  };

  return (
    <div
      id="task-reminder-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="task-reminder-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-reminder-modal-title"
        className="w-full max-w-[360px] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simple Minimal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h3 id="task-reminder-modal-title" className="text-sm font-semibold text-slate-900 dark:text-white">
              Task Reminders
            </h3>
          </div>
          <button
            type="button"
            id="close-task-reminder-modal-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean, Simple Body */}
        <div className="p-5 space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">
              Daily Task Reminders
            </span>
            <button
              type="button"
              id="toggle-task-reminders-master-btn"
              onClick={handleToggle}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none ${
                settings.enabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-zinc-700'
              }`}
              role="switch"
              aria-checked={settings.enabled}
              aria-label="Toggle task reminders"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 shadow-xs ring-0 transition duration-150 ease-in-out ${
                  settings.enabled ? 'translate-x-4 dark:bg-zinc-900' : 'translate-x-0 dark:bg-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Simple Dropdown for Interval */}
          <div className="space-y-1.5">
            <label htmlFor="reminder-interval-select" className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Remind Every
            </label>
            <select
              id="reminder-interval-select"
              value={selectedOption}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors cursor-pointer"
            >
              <option value="60">1 Hour (Default)</option>
              <option value="30">30 Minutes</option>
              <option value="120">2 Hours</option>
              <option value="180">3 Hours</option>
              <option value="custom">Custom (Hours &amp; Minutes)...</option>
            </select>
          </div>

          {/* Custom Hours and Minutes Inputs */}
          {selectedOption === 'custom' && (
            <div className="pt-1.5 animate-in fade-in duration-150 space-y-2">
              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Custom Duration
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Hours Box */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <input
                      id="custom-interval-hours-input"
                      type="number"
                      min="0"
                      max="24"
                      value={customHours}
                      onChange={(e) => handleCustomHoursChange(e.target.value)}
                      placeholder="0"
                      className="w-full pl-3 pr-10 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors text-center"
                    />
                    <span className="absolute right-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 pointer-events-none select-none">
                      hrs
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                    Hours (0-24)
                  </span>
                </div>

                {/* Minutes Box */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <input
                      id="custom-interval-minutes-input"
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => handleCustomMinutesChange(e.target.value)}
                      placeholder="0"
                      className="w-full pl-3 pr-10 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors text-center"
                    />
                    <span className="absolute right-3 text-[11px] font-medium text-slate-400 dark:text-zinc-500 pointer-events-none select-none">
                      min
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                    Minutes (0-59)
                  </span>
                </div>
              </div>

              {/* Total Preview */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 px-1 pt-0.5">
                <span>Calculated interval:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {formatTotalPreview(customHours, customMinutes)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Clean Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-end">
          <button
            type="button"
            id="save-task-reminder-settings-btn"
            onClick={handleDone}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
