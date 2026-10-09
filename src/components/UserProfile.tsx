import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Mail,
  Calendar,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Code,
  Award,
  ArrowRight,
  Check,
  LogOut,
  Lock,
  Edit3,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  ArrowLeft,
  Settings,
  FileText,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  UploadCloud,
  MessageSquare,
  Send,
} from 'lucide-react';
import { User, UserProfileStats, FeedbackItem } from '../types.ts';
import { ThemeToggle } from './ThemeToggle.tsx';
import { ImportConsole } from './ImportConsole.tsx';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'subjects' | 'coding' | 'calendar' | 'import' | 'admin') => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  isSettingsOpen?: boolean;
  onOpenSettings?: () => void;
  onCloseSettings?: () => void;
  activeProfileTab?: ProfileTab;
  onProfileTabChange?: (tab: ProfileTab) => void;
}

export type ProfileTab = 'profile' | 'security' | 'danger' | 'permissions' | 'extractor' | 'feedback' | null;

export function UserProfile({
  user,
  onUpdateUser,
  onLogout,
  onNavigateToTab,
  onNavigateToTerms,
  onNavigateToPrivacy,
  isSettingsOpen,
  onOpenSettings,
  onCloseSettings,
  activeProfileTab,
  onProfileTabChange,
}: UserProfileProps) {
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Active Navigation Tab (Defaults to null - do not show anything here by default on desktop until clicked)
  const [activeTab, setActiveTab] = useState<ProfileTab>(activeProfileTab ?? null);

  // Mobile Dynamic Sub-page state ('overview' | 'profile' | 'security' | 'permissions' | 'danger' | 'feedback')
  // On mobile: default is 'overview' (only profile info card + dashboard). Clicking setting options opens dynamic sub-page.
  const [mobileSubPage, setMobileSubPage] = useState<'overview' | 'profile' | 'security' | 'permissions' | 'danger' | 'feedback'>('overview');

  // Mobile Settings Hub Modal state (controlled from top nav Settings button or internal)
  const [internalSettingsModalOpen, setInternalSettingsModalOpen] = useState(false);
  const isSettingsModalOpen = isSettingsOpen !== undefined ? isSettingsOpen : internalSettingsModalOpen;
  const setIsSettingsModalOpen = (open: boolean) => {
    if (onCloseSettings && !open) onCloseSettings();
    if (onOpenSettings && open) onOpenSettings();
    setInternalSettingsModalOpen(open);
  };

  // Floating Toast State
  const [toast, setToast] = useState<{
    title: string;
    message?: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (title: string, message?: string, type: 'success' | 'error' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.title === title ? null : curr));
    }, 4500);
  };

  // Edit Name Form State
  const [nameInput, setNameInput] = useState(user.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete Account State
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Feedback Form State
  const [feedbackCategory, setFeedbackCategory] = useState<'General' | 'Feature' | 'Bug' | 'Suggestion'>('General');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoadingMyFeedbacks, setIsLoadingMyFeedbacks] = useState(false);

  // Sync activeProfileTab if passed from parent (e.g. top nav)
  useEffect(() => {
    setActiveTab(activeProfileTab ?? null);
    if (activeProfileTab === 'feedback') {
      setMobileSubPage('feedback');
    }
  }, [activeProfileTab]);

  // Fetch feedbacks submitted by current user
  const fetchMyFeedbacks = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setIsLoadingMyFeedbacks(true);
      const res = await fetch('/api/feedback/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyFeedbacks(data.feedbacks || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMyFeedbacks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feedback' || mobileSubPage === 'feedback') {
      fetchMyFeedbacks();
    }
  }, [activeTab, mobileSubPage]);

  // Submit Feedback Handler
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(false);

    if (!feedbackTitle.trim()) {
      setFeedbackError('Please enter a title for your feedback');
      return;
    }
    if (feedbackTitle.trim().length < 3) {
      setFeedbackError('Title must be at least 3 characters long');
      return;
    }
    if (!feedbackDescription.trim()) {
      setFeedbackError('Please enter a description for your feedback');
      return;
    }
    if (feedbackDescription.trim().length < 5) {
      setFeedbackError('Description must be at least 5 characters long');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setFeedbackError('Authentication required. Please sign in again.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const finalTitle = feedbackCategory === 'General'
        ? feedbackTitle.trim()
        : `[${feedbackCategory}] ${feedbackTitle.trim()}`;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: finalTitle,
          description: feedbackDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackTitle('');
        setFeedbackDescription('');
        showToast('Feedback submitted successfully', 'Thank you! The admin team will review your feedback.');
        fetchMyFeedbacks();
      } else {
        const err = data.fieldErrors?.title || data.fieldErrors?.description || data.message || 'Failed to submit feedback';
        setFeedbackError(err);
        showToast('Feedback submission failed', err, 'error');
      }
    } catch {
      setFeedbackError('Network error while submitting feedback');
      showToast('Network error', 'Could not reach server', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Sync state if user prop changes
  useEffect(() => {
    setNameInput(user.name);
  }, [user.name]);

  // Load Profile Stats from server
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      setIsLoadingStats(true);
      try {
        const res = await fetch('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setStats(data.stats);
          }
          if (data.user) {
            onUpdateUser(data.user);
            setNameInput(data.user.name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchProfile();
  }, []);

  // 1. Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);

    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Full name cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Full name must be at least 2 characters');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setNameError('Authentication required. Please sign in again.');
      return;
    }

    setIsSavingName(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onUpdateUser(data.user);
        setNameSuccess(true);
        showToast('Name saved successfully', `Your display name has been updated to "${data.user.name}".`);
        setTimeout(() => setNameSuccess(false), 4000);
      } else {
        const err = data.fieldErrors?.name || data.message || 'Failed to update name';
        setNameError(err);
        showToast('Failed to save name', err, 'error');
      }
    } catch {
      setNameError('Network error while updating name');
      showToast('Network error', 'Could not reach server to update name', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  // 2. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password to verify your identity');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter your new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password cannot be identical to your current password');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setPasswordError('Authentication required. Please sign in again.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password changed successfully', 'Your new password is now active. Your current session remains authenticated.');
        setTimeout(() => setPasswordSuccess(false), 5000);
      } else {
        const err =
          data.fieldErrors?.currentPassword ||
          data.fieldErrors?.newPassword ||
          data.fieldErrors?.confirmPassword ||
          data.message ||
          'Failed to change password';
        setPasswordError(err);
        showToast('Password update failed', err, 'error');
      }
    } catch {
      setPasswordError('Network error while changing password');
      showToast('Network error', 'Could not reach server to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 3. Delete Account
  const isDeleteConfirmationMatching =
    deleteConfirmationInput.trim() === 'DELETE' ||
    deleteConfirmationInput.trim().toLowerCase() === user.email.toLowerCase();

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!isDeleteConfirmationMatching) {
      setDeleteError(`Please type "${user.email}" or "DELETE" to confirm irreversible account deletion.`);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setDeleteError('Authentication required. Please sign in again.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation: deleteConfirmationInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDeleteSuccess(true);
        showToast('Account permanently deleted', 'Signing you out of ProgressPath...');
        setTimeout(() => {
          onLogout();
        }, 1200);
      } else {
        const err = data.message || 'Failed to delete account. Please try again.';
        setDeleteError(err);
        showToast('Deletion failed', err, 'error');
        setIsDeletingAccount(false);
      }
    } catch {
      const err = 'Network error while requesting account deletion.';
      setDeleteError(err);
      showToast('Network error', err, 'error');
      setIsDeletingAccount(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Active Scholar';
    try {
      const d = new Date(dateStr);
      return `Member since ${d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } catch {
      return 'Active Scholar';
    }
  };

  return (
    <div id="user-profile-page" className="w-full flex flex-col gap-2.5 sm:gap-5 md:gap-6 pb-12 relative">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="profile-floating-toast"
          className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl shadow-lg border flex items-start gap-3 transition-all transform animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold">{toast.title}</h4>
            {toast.message && (
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer rounded"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Identity Header Card: Visible on desktop always, on mobile only in overview mode */}
      <div className={`${mobileSubPage !== 'overview' ? 'hidden md:flex' : 'flex'} bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-5 flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-5 shadow-xs transition-colors`}>
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-slate-900 dark:bg-indigo-950 text-white border border-slate-800 dark:border-indigo-800 flex items-center justify-center text-lg sm:text-2xl font-bold select-none">
              {getInitials(user.name)}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
              title="Online Active"
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {user.name}
              </h1>
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                  <Shield className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  Administrator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                  <GraduationCap className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  Student
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1 truncate max-w-full">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Top Quick Action: Settings button */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            id="desktop-top-settings-btn"
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Mobile Top Quick Action Bar: Feedback option right next to Settings */}
        <div className="flex md:hidden items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full mt-1">
          <button
            id="mobile-top-settings-btn"
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 active:scale-95 transition-all"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            id="mobile-top-feedback-btn"
            type="button"
            onClick={() => {
              const next = mobileSubPage === 'feedback' ? 'overview' : 'feedback';
              setActiveTab(next === 'feedback' ? 'feedback' : null);
              setMobileSubPage(next);
              onProfileTabChange?.(next === 'feedback' ? 'feedback' : null);
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all border ${
              mobileSubPage === 'feedback' || activeTab === 'feedback'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Feedback</span>
          </button>
        </div>
      </div>

      {/* Metric Bento-Grid: Visible on desktop always, on mobile only in overview mode */}
      <div className={`${mobileSubPage !== 'overview' ? 'hidden md:grid' : 'grid'} grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4`}>
        {/* Readiness Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500">
              Exam Readiness
            </span>
            <div className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : `${stats?.overallReadinessPercent ?? 0}%`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.overallReadinessPercent ?? 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lectures Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500">
              Lectures Done
            </span>
            <div className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : stats?.lecturesCompleted ?? 0}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">
                of {stats?.totalLectures ?? 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats && stats.totalLectures > 0
                      ? Math.min(100, Math.round((stats.lecturesCompleted / stats.totalLectures) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Coding Problems Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500">
              Coding Solved
            </span>
            <div className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : stats?.problemsSolved ?? 0}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">
                of {stats?.totalProblems ?? 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats && stats.totalProblems > 0
                      ? Math.min(100, Math.round((stats.problemsSolved / stats.totalProblems) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Academic Curriculum Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-500">
              Curriculum Hub
            </span>
            <div className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : stats?.subjectsCount ?? 0}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">
                Subjects
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 truncate">
              {stats?.eventsCount ?? 0} scheduled tasks
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs: Visible on desktop, hidden on mobile */}
      <div
        id="profile-subnav-tabs-bar"
        className="hidden md:flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none shrink-0"
      >
        {/* YouTube Playlist Extractor Tab - Desktop / Website Frame Size */}
        <button
          id="profile-subtab-extractor"
          type="button"
          onClick={() => {
            const next = activeTab === 'extractor' ? null : 'extractor';
            setActiveTab(next);
            onProfileTabChange?.(next);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'extractor'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>YouTube Playlist Extractor</span>
        </button>

        {/* Feedback Tab - Desktop / Website Frame Size */}
        <button
          id="profile-subtab-feedback"
          type="button"
          onClick={() => {
            const next = activeTab === 'feedback' ? null : 'feedback';
            setActiveTab(next);
            onProfileTabChange?.(next);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'feedback'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Feedback</span>
        </button>
      </div>

      {/* Mobile Dynamic Sub-Page Header (Only on mobile when performing a specific task) */}
      {mobileSubPage !== 'overview' && (
        <div className="md:hidden flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs animate-in fade-in duration-150">
          <button
            type="button"
            id="mobile-back-to-profile-btn"
            onClick={() => {
              setMobileSubPage('overview');
              setActiveTab('profile');
              onProfileTabChange?.('profile');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Back to Profile</span>
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {mobileSubPage === 'profile'
              ? 'Personal Information'
              : mobileSubPage === 'security'
              ? 'Change Password'
              : mobileSubPage === 'permissions'
              ? 'Roles & Permissions'
              : mobileSubPage === 'feedback'
              ? 'Feedback & Suggestions'
              : 'Delete Account'}
          </span>
        </div>
      )}

      {/* SECTION 1: Personal Information (Name editable with Save button, Email read-only) */}
      {(
        mobileSubPage === 'profile' ||
        activeTab === 'profile'
      ) && (
        <section
          id="profile-personal-info-section"
          className={`${
            mobileSubPage !== 'profile' ? 'hidden md:block' : 'block'
          } bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-xs animate-in fade-in duration-150`}
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Personal Information</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your personal display name and review your registered account details.
              </p>
            </div>
            <button
              type="button"
              id="profile-close-personal-info-btn"
              onClick={() => {
                setActiveTab(null);
                setMobileSubPage('overview');
                onProfileTabChange?.(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Personal Information"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {nameSuccess && (
            <div
              id="name-update-success"
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Display name successfully saved and updated across all dashboards.</span>
            </div>
          )}

          {nameError && (
            <div
              id="name-update-error"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}

          <form onSubmit={handleSaveName} className="space-y-4 max-w-xl">
            {/* Editable Name Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="profile-name-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Full Name <span className="text-slate-400 font-normal">(Editable)</span>
                </label>
                {nameInput !== user.name && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user.name);
                      setNameError(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="profile-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  disabled={isSavingName}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This name will appear on your progress badges, certificates, and comments.
              </p>
            </div>

            {/* Read-only Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="profile-email-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Email Address <span className="text-slate-400 font-normal">(Read-only)</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock className="w-2.5 h-2.5" /> Fixed Credential
                </span>
              </div>
              <div className="relative">
                <input
                  id="profile-email-input"
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed select-all"
                  aria-describedby="profile-email-hint"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p id="profile-email-hint" className="text-[11px] text-slate-400 mt-1">
                Your email address is your primary account identifier and cannot be modified directly.
              </p>
            </div>

            {/* Save Name Action Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                id="save-profile-name-btn"
                type="submit"
                disabled={isSavingName || !nameInput.trim() || nameInput.trim() === user.name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {isSavingName ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Name</span>
                  </>
                )}
              </button>

              {nameInput !== user.name && (
                <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  Unsaved changes
                </span>
              )}
            </div>
          </form>

          {/* Quick Tool Shortcut: YouTube Playlist Extractor */}
          <div
            id="profile-desktop-youtube-extractor-card"
            className="hidden md:flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 transition-colors mt-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                  YouTube Playlist Extractor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Import full lecture series directly into your curriculum.
                </p>
              </div>
            </div>

            <button
              id="profile-open-extractor-btn"
              type="button"
              onClick={() => setActiveTab('extractor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 transition-colors cursor-pointer shadow-2xs"
            >
              <span>Open Extractor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* SECTION: YouTube Playlist Extractor Workspace (Website / Desktop Frame Only) */}
      {activeTab === 'extractor' && (
        <section
          id="profile-youtube-extractor-workspace"
          className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>YouTube Playlist Extractor</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Extract video lectures from any public playlist directly into your curriculum.
              </p>
            </div>

            <button
              type="button"
              id="profile-close-extractor-btn"
              onClick={() => {
                setActiveTab(null);
                onProfileTabChange?.(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Extractor"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          <ImportConsole
            hideHeader={true}
            onNavigateToSubject={(id) => onNavigateToTab('subjects')}
            onNavigateToCoding={() => onNavigateToTab('coding')}
          />
        </section>
      )}

      {/* SECTION: User Feedback Form (Website Frame & Mobile Frame Size) */}
      {(
        mobileSubPage === 'feedback' ||
        activeTab === 'feedback'
      ) && (
        <section
          id="profile-feedback-section"
          className={`${
            mobileSubPage !== 'feedback' ? 'hidden md:block' : 'block'
          } bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5 shadow-xs animate-in fade-in duration-150`}
        >
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Feedback & Suggestions</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Share your ideas, report issues, or suggest improvements to help us make the app better.
              </p>
            </div>

            <button
              type="button"
              id="profile-close-feedback-btn"
              onClick={() => {
                setActiveTab(null);
                setMobileSubPage('overview');
                onProfileTabChange?.(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Feedback"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {feedbackSuccess && (
            <div
              id="feedback-submit-success"
              className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                Thank you! Your feedback has been received and recorded.
              </span>
            </div>
          )}

          {feedbackError && (
            <div
              id="feedback-submit-error"
              className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} className="space-y-4 max-w-2xl">
            {/* Category Segmented Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Type
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-fit">
                {(['General', 'Feature', 'Bug', 'Suggestion'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFeedbackCategory(cat)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      feedbackCategory === cat
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat === 'Feature' ? 'Feature Idea' : cat === 'Bug' ? 'Report Bug' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Subject */}
            <div id="feedback-title-block">
              <label
                htmlFor="feedback-title-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Subject
              </label>
              <input
                id="feedback-title-input"
                type="text"
                value={feedbackTitle}
                onChange={(e) => {
                  setFeedbackTitle(e.target.value);
                  if (feedbackError) setFeedbackError(null);
                }}
                disabled={isSubmittingFeedback}
                placeholder="Brief summary of your feedback..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
                required
              />
            </div>

            {/* Description Textarea */}
            <div id="feedback-description-block">
              <label
                htmlFor="feedback-description-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Details
              </label>
              <textarea
                id="feedback-description-input"
                rows={4}
                value={feedbackDescription}
                onChange={(e) => {
                  setFeedbackDescription(e.target.value);
                  if (feedbackError) setFeedbackError(null);
                }}
                disabled={isSubmittingFeedback}
                placeholder="Explain what happened, what you expected, or what you would like to see..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors resize-y leading-relaxed"
                required
              />
            </div>

            {/* Submit Action Row */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                id="submit-feedback-btn"
                type="submit"
                disabled={isSubmittingFeedback || !feedbackTitle.trim() || !feedbackDescription.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {isSubmittingFeedback ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                From <span className="text-slate-600 dark:text-slate-400">{user.name}</span> ({user.email})
              </span>
            </div>
          </form>

          {/* User's Previously Submitted Feedback Section */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Past Submissions ({myFeedbacks.length})
              </h3>
              {isLoadingMyFeedbacks && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              )}
            </div>

            {myFeedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                No previous feedback submitted yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                        {fb.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                      {fb.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 2: Change Password */}
      {(
        mobileSubPage === 'security' ||
        activeTab === 'security'
      ) && (
        <section
          id="profile-password-section"
          className={`${
            mobileSubPage !== 'security' ? 'hidden md:block' : 'block'
          } bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-xs`}
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-700" />
                <span>Change Password</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your current password to verify your identity, then set a new secure password.
              </p>
            </div>
            <button
              type="button"
              id="profile-close-password-btn"
              onClick={() => {
                setActiveTab(null);
                setMobileSubPage('overview');
                onProfileTabChange?.(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Change Password"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {passwordSuccess && (
            <div
              id="password-change-success"
              className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">
                Password successfully changed. Your current session remains active and secure.
              </span>
            </div>
          )}

          {passwordError && (
            <div
              id="password-change-error"
              className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {/* 1. Current Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="current-password-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Current Password <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-slate-500">Identity confirmation</span>
              </div>
              <div className="relative">
                <input
                  id="current-password-input"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isChangingPassword}
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
                <button
                  id="toggle-current-password-visibility"
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. New Password */}
            <div>
              <label
                htmlFor="new-password-input"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                New Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isChangingPassword}
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  id="toggle-new-password-visibility"
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <span>Minimum 6 characters</span>
              </div>
            </div>

            {/* 3. Confirm New Password */}
            <div>
              <label
                htmlFor="confirm-password-input"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Confirm New Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isChangingPassword}
                  className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
                <button
                  id="toggle-confirm-password-visibility"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && confirmPassword && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Password Button */}
            <div className="pt-2">
              <button
                id="change-password-submit-btn"
                type="submit"
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying & Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SECTION 3: Delete Account (Danger Zone) */}
      {(
        mobileSubPage === 'danger' ||
        activeTab === 'danger'
      ) && (
        <section
          id="delete-account-section"
          className={`${
            mobileSubPage !== 'danger' ? 'hidden md:block' : 'block'
          } rounded-xl border-2 border-rose-300 bg-rose-50/50 p-5 sm:p-6 space-y-4 shadow-xs`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-rose-950 flex items-center gap-2">
                  <span>Danger Zone: Delete Account</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded">
                    Irreversible
                  </span>
                </h2>
                <p className="text-xs text-rose-800/90 mt-0.5">
                  Permanently purge your account credentials and personal study records.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="profile-close-danger-btn"
              onClick={() => {
                setActiveTab(null);
                setMobileSubPage('overview');
                onProfileTabChange?.(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors"
              title="Close Danger Zone"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Scope notice box */}
          <div className="p-3.5 sm:p-4 bg-white/90 border border-rose-200 rounded-lg text-xs text-slate-700 space-y-2 leading-relaxed">
            <p className="font-semibold text-rose-950">
              Deleting your account will permanently remove:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-xs">
              <li>Your personal profile credentials and login access</li>
              <li>Your personal authored subjects and lectures</li>
              <li>Your custom problems, notes, and code submissions</li>
              <li>Your personal study milestones and completion checkmarks</li>
            </ul>
            <div className="pt-2 border-t border-rose-100 flex items-center gap-1.5 text-emerald-800 font-medium text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Platform-wide global shared curricula and public problems will NOT be deleted.</span>
            </div>
          </div>

          {deleteSuccess && (
            <div
              id="delete-account-success-banner"
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Account successfully deleted. You will now be signed out.</span>
            </div>
          )}

          {deleteError && (
            <div
              id="delete-account-error-banner"
              className="p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <form onSubmit={handleDeleteAccount} className="space-y-3.5 max-w-lg">
            <div>
              <label
                htmlFor="delete-account-confirm-input"
                className="block text-xs font-semibold text-slate-900 mb-1.5 leading-relaxed"
              >
                To confirm deletion, please type your email (
                <span className="font-mono text-rose-700 select-all font-bold">{user.email}</span>
                ) or <span className="font-mono text-rose-700 font-bold">DELETE</span>:
              </label>
              <input
                id="delete-account-confirm-input"
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => {
                  setDeleteConfirmationInput(e.target.value);
                  if (deleteError) setDeleteError(null);
                }}
                disabled={isDeletingAccount || deleteSuccess}
                placeholder={`Type "${user.email}" or "DELETE"`}
                className="w-full px-3 py-2 text-sm bg-white border border-rose-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-colors text-slate-900 placeholder:text-slate-400 font-mono text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                id="delete-account-submit-btn"
                type="submit"
                disabled={!isDeleteConfirmationMatching || isDeletingAccount || deleteSuccess}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Account & Personal Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete Account</span>
                  </>
                )}
              </button>

              {deleteConfirmationInput && !isDeleteConfirmationMatching && (
                <span className="text-xs text-rose-700 font-medium">
                  Input must match your email or "DELETE" exactly
                </span>
              )}
            </div>
          </form>
        </section>
      )}

      {/* SECTION 4: Role & Permissions Info */}
      {(
        mobileSubPage === 'permissions' ||
        activeTab === 'permissions'
      ) && (
        <section
          id="profile-permissions-section"
          className={`${
            mobileSubPage !== 'permissions' ? 'hidden md:block' : 'block'
          } bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  {user.role === 'admin' ? 'Administrator Privileges' : 'Student Scholar Privileges'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role capabilities and feature access assigned to your account.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="profile-close-permissions-btn"
              onClick={() => {
                setActiveTab(null);
                setMobileSubPage('overview');
                onProfileTabChange?.(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Roles & Permissions"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Curriculum & Learning Management</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create subjects, add lectures with sequential sessions, toggle completion status, and import bulk curricula via the Import Console.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Coding Repository Access</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practice Easy, Medium, and Hard algorithmic challenges, filter by topic, track completion rates, and submit solutions.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Academic Calendar & Milestone Tracking</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Schedule exams, deadlines, and daily study tasks with the integrated calendar view.
              </p>
            </div>

            {user.role === 'admin' ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <Shield className="w-4 h-4 text-slate-700" />
                  <span>Admin Performance Monitor</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Access cross-student comparison tables, sort user metrics by lectures completed and readiness, and view aggregate platform activity.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('admin')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline pt-1 cursor-pointer"
                >
                  <span>Open Admin Monitor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Personal Progress Isolation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your study records, completion ticks, and private subject collections are securely scoped to your account.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Profile Footer with Legal Links */}
      <footer className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} ProgressPath · Student Learning Platform</span>
        </div>
        <div className="flex items-center gap-4">
          {onNavigateToTerms && (
            <button
              id="profile-footer-terms-btn"
              type="button"
              onClick={onNavigateToTerms}
              className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
          )}
          {onNavigateToPrivacy && (
            <button
              id="profile-footer-privacy-btn"
              type="button"
              onClick={onNavigateToPrivacy}
              className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
          )}
          <a
            href="mailto:luckypc08292@gmail.com"
            className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
          >
            Support
          </a>
        </div>
      </footer>

      {/* Settings & Services Floating Drawer on Right Side */}
      {isSettingsModalOpen && (
        <div
          id="profile-settings-modal-overlay"
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/20 dark:bg-black/35 backdrop-blur-[0.5px] transition-opacity animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSettingsModalOpen(false);
          }}
        >
          <div
            id="profile-settings-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-settings-modal-title"
            className="w-[88%] max-w-[340px] sm:w-full sm:max-w-md h-full sm:h-[calc(100vh-1.5rem)] sm:my-3 sm:mr-3 bg-white dark:bg-slate-900 shadow-2xl border-l sm:border border-slate-200/90 dark:border-slate-800 rounded-l-2xl sm:rounded-2xl p-2.5 sm:p-5 pt-2 sm:pt-4 overflow-y-auto space-y-2 sm:space-y-3.5 animate-slide-in-right z-10 flex flex-col justify-start"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 shadow-2xs shrink-0">
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 id="profile-settings-modal-title" className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    Settings & Services
                  </h3>
                  <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    Account management, privacy & security
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-profile-settings-btn"
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* List of Settings Service Cards */}
            <div className="space-y-1.5 sm:space-y-2.5">
              {/* Appearance & Theme Preference Toggle */}
              <div
                id="settings-theme-preference-card"
                className="p-2 sm:p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5 sm:space-y-2 transition-all"
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      Theme Preference
                    </h4>
                    <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Choose between Light, Dark, or System mode
                    </p>
                  </div>
                </div>

                <ThemeToggle variant="cards" showDescription={false} />
              </div>

              {/* Share Feedback & Suggestions Service Card */}
              <button
                type="button"
                id="settings-service-feedback"
                onClick={() => {
                  setActiveTab('feedback');
                  setMobileSubPage('feedback');
                  setIsSettingsModalOpen(false);
                  onProfileTabChange?.('feedback');
                }}
                className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Feedback & Suggestions
                    </h4>
                    <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Share ideas, bug reports, or feature requests
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* 1. Edit Personal Information */}
              <button
                type="button"
                id="settings-service-personal-info"
                onClick={() => {
                  setActiveTab('profile');
                  setMobileSubPage('profile');
                  setIsSettingsModalOpen(false);
                  onProfileTabChange?.('profile');
                }}
                className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Edit Personal Information
                    </h4>
                    <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Display name, email & profile details
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* 2. Change Password */}
              <button
                type="button"
                id="settings-service-password-change"
                onClick={() => {
                  setActiveTab('security');
                  setMobileSubPage('security');
                  setIsSettingsModalOpen(false);
                  onProfileTabChange?.('security');
                }}
                className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Change Password
                    </h4>
                    <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Update your account security password
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* 3. Roles & Permissions */}
              <button
                type="button"
                id="settings-service-roles-permissions"
                onClick={() => {
                  setActiveTab('permissions');
                  setMobileSubPage('permissions');
                  setIsSettingsModalOpen(false);
                  onProfileTabChange?.('permissions');
                }}
                className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Roles & Permissions
                    </h4>
                    <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      View role privileges & system access
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* 4. Privacy Guidelines */}
              {onNavigateToPrivacy && (
                <button
                  type="button"
                  id="settings-service-privacy"
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    onNavigateToPrivacy();
                  }}
                  className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Privacy Guidelines
                      </h4>
                      <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Data privacy policy & GDPR compliance
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}

              {/* 5. Terms of Service */}
              {onNavigateToTerms && (
                <button
                  type="button"
                  id="settings-service-terms"
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    onNavigateToTerms();
                  }}
                  className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Terms of Service
                      </h4>
                      <p className="text-[9.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Platform usage rules & academic agreements
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )}

              {/* 6. Delete Account (Danger Zone) */}
              <button
                type="button"
                id="settings-service-delete-account"
                onClick={() => {
                  setActiveTab('danger');
                  setMobileSubPage('danger');
                  setIsSettingsModalOpen(false);
                  onProfileTabChange?.('danger');
                }}
                className="w-full flex items-center justify-between p-2 sm:p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 group-hover:text-rose-800 dark:group-hover:text-rose-300 transition-colors">
                      Delete Account
                    </h4>
                    <p className="text-[9.5px] sm:text-[11px] text-rose-500 dark:text-rose-400/80 truncate">
                      Permanent account removal & data purge
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>

            {/* Logout Footer Option */}
            <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Log Out of ProgressPath</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
