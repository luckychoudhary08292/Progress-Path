import React, { useEffect } from 'react';
import { FileText, X } from 'lucide-react';

interface PdfNoticeModalProps {
  isOpen: boolean;
  title?: string;
  subjectName?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export function PdfNoticeModal({
  isOpen,
  subjectName,
  onClose,
}: PdfNoticeModalProps) {
  // Auto-remove notification in 3 seconds as requested
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  // Support escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="pdf-notice-modal-overlay"
      role="status"
      aria-live="polite"
      className="fixed top-5 sm:top-6 inset-x-0 z-50 flex items-center justify-center pointer-events-none px-4 animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div
        id="pdf-notice-modal-card"
        onClick={onClose}
        className="pointer-events-auto cursor-pointer inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 rounded-full shadow-lg shadow-slate-950/20 dark:shadow-black/30 border border-slate-700/60 dark:border-slate-300/70 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <FileText className="w-4 h-4 text-indigo-400 dark:text-indigo-600 shrink-0" />
        <span className="text-xs sm:text-sm font-medium tracking-tight">
          No study notes available{subjectName ? ` · ${subjectName}` : ''}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-1 text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 p-0.5 rounded-full transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
