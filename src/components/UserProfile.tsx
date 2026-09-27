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
  Copy,
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
  Sparkles,
  X,
} from 'lucide-react';
import { User, UserProfileStats } from '../types.ts';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'subjects' | 'coding' | 'calendar' | 'import' | 'admin') => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

type ProfileTab = 'all' | 'profile' | 'security' | 'danger' | 'permissions';

export function UserProfile({
  user,
  onUpdateUser,
  onLogout,
  onNavigateToTab,
  onNavigateToTerms,
  onNavigateToPrivacy,
}: UserProfileProps) {
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');

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

  // Copy ID State
  const [copiedId, setCopiedId] = useState(false);

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

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setCopiedId(false);
    }
  };

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
    <div id="user-profile-page" className="w-full space-y-6 pb-12 relative">
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

      {/* Top Identity Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg sm:text-2xl font-bold select-none">
              {getInitials(user.name)}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
              title="Online Active"
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                {user.name}
              </h1>
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                  <Shield className="w-3 h-3 text-slate-600" />
                  Administrator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  <GraduationCap className="w-3 h-3 text-slate-600" />
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

            <div className="pt-1 flex items-center gap-2">
              <button
                id="copy-user-id-btn"
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Copy User ID"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied UID</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>UID: {user.id ? `${user.id.substring(0, 10)}...` : 'User'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center justify-start sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            id="profile-sign-out-btn"
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metric Bento-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Readiness Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Exam Readiness
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : `${stats?.overallReadinessPercent ?? 0}%`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.overallReadinessPercent ?? 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lectures Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Lectures Done
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : stats?.lecturesCompleted ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                of {stats?.totalLectures ?? 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Coding Solved
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Code className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : stats?.problemsSolved ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                of {stats?.totalProblems ?? 0}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Curriculum Hub
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isLoadingStats ? '--' : stats?.subjectsCount ?? 0}
              </span>
              <span className="text-xs text-slate-500">
                Subjects ({stats?.eventsCount ?? 0} Tasks)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 truncate">
              {user.role === 'admin'
                ? 'Full administrative authoring'
                : 'Enrolled in academic curriculum'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          id="profile-subtab-all"
          type="button"
          onClick={() => setActiveTab('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Settings</span>
        </button>

        <button
          id="profile-subtab-overview"
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Personal Info</span>
        </button>

        <button
          id="profile-subtab-security"
          type="button"
          onClick={() => setActiveTab('security')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>

        <button
          id="profile-subtab-danger"
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'danger'
              ? 'bg-rose-600 text-white font-semibold'
              : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Account</span>
        </button>

        <button
          id="profile-subtab-permissions"
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === 'permissions'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role & Permissions</span>
        </button>
      </div>

      {/* SECTION 1: Personal Information (Name editable with Save button, Email read-only) */}
      {(activeTab === 'all' || activeTab === 'profile') && (
        <section
          id="profile-personal-info-section"
          className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-xs"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-700" />
              <span>Personal Information</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal display name and review your registered account details.
            </p>
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
        </section>
      )}

      {/* SECTION 2: Change Password (current password, new password, confirm new password) */}
      {(activeTab === 'all' || activeTab === 'security') && (
        <section
          id="profile-password-section"
          className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-xs"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-700" />
              <span>Change Password</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your current password to verify your identity, then set a new secure password.
            </p>
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

      {/* SECTION 3: Delete Account (visually separated red-bordered box at the bottom) */}
      {(activeTab === 'all' || activeTab === 'danger') && (
        <section
          id="delete-account-section"
          className="rounded-xl border-2 border-rose-300 bg-rose-50/50 p-5 sm:p-6 space-y-4 shadow-xs"
        >
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

      {/* SECTION 4: Role & Permissions Info (when explicitly selected) */}
      {activeTab === 'permissions' && (
        <section
          id="profile-permissions-section"
          className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                {user.role === 'admin' ? 'Administrator Privileges' : 'Student Scholar Privileges'}
              </h2>
              <p className="text-xs text-slate-500">
                Role capabilities and feature access assigned to your account.
              </p>
            </div>
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

      {/* Quick Hub Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          onClick={() => onNavigateToTab('subjects')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left group cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 mt-3">Subjects & Lectures</h3>
          <p className="text-xs text-slate-500 mt-0.5">Explore structured curricula and track session progress.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('coding')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left group cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Code className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 mt-3">Coding Repository</h3>
          <p className="text-xs text-slate-500 mt-0.5">Solve algorithmic problems sorted by topic & difficulty.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToTab('calendar')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left group cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 mt-3">Academic Calendar</h3>
          <p className="text-xs text-slate-500 mt-0.5">Plan study milestones and view scheduled tasks.</p>
        </button>
      </div>

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
    </div>
  );
}
