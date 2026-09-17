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
  FileCode,
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
  Sparkles,
} from 'lucide-react';
import { User, UserProfileStats } from '../types.ts';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'subjects' | 'coding' | 'calendar' | 'import' | 'admin') => void;
}

export function UserProfile({
  user,
  onUpdateUser,
  onLogout,
  onNavigateToTab,
}: UserProfileProps) {
  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Edit Name Form State
  const [nameInput, setNameInput] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Copy ID State
  const [copiedId, setCopiedId] = useState(false);

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'security' | 'permissions'>('overview');

  // Load Profile Stats
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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);

    if (!nameInput.trim()) {
      setNameError('Full name cannot be empty');
      return;
    }
    if (nameInput.trim().length < 2) {
      setNameError('Full name must be at least 2 characters');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsSavingName(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onUpdateUser(data.user);
        setNameSuccess(true);
        setIsEditingName(false);
        setTimeout(() => setNameSuccess(false), 3000);
      } else {
        setNameError(data.fieldErrors?.name || data.message || 'Failed to update name');
      }
    } catch (err) {
      setNameError('Network error while updating name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter your new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

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
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 4000);
      } else {
        setPasswordError(
          data.fieldErrors?.currentPassword ||
            data.fieldErrors?.newPassword ||
            data.message ||
            'Failed to change password'
        );
      }
    } catch (err) {
      setPasswordError('Network error while changing password');
    } finally {
      setIsChangingPassword(false);
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
    <div id="user-profile-page" className="w-full space-y-6 pb-12">
      {/* Top Identity Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Avatar and User Info */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
              {getInitials(user.name)}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
              title="Online"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {user.name}
              </h1>
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                  <Shield className="w-3 h-3 text-slate-600" />
                  Administrator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <GraduationCap className="w-3 h-3 text-slate-600" />
                  Student
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1">
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
                    <span className="text-emerald-700 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>UID: {user.id.substring(0, 12)}...</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 shrink-0">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Metric */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
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

        {/* Academic Calendar Events */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
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
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
        <button
          id="profile-subtab-overview"
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Profile & Account</span>
        </button>

        <button
          id="profile-subtab-security"
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Security & Password</span>
        </button>

        <button
          id="profile-subtab-permissions"
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'permissions'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role & Quick Hub</span>
        </button>
      </div>

      {/* Tab 1: Profile & Account Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display name and review your registered account details.
                </p>
              </div>

              {!isEditingName && (
                <button
                  id="edit-profile-name-btn"
                  type="button"
                  onClick={() => {
                    setNameInput(user.name);
                    setNameError(null);
                    setIsEditingName(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Name</span>
                </button>
              )}
            </div>

            {nameSuccess && (
              <div
                id="name-update-success"
                className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Display name successfully updated and synced across all portals.</span>
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

            {/* Edit Name Form or Display */}
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="space-y-4 max-w-lg">
                <div>
                  <label
                    htmlFor="profile-name-input"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    disabled={isSavingName}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="save-profile-name-btn"
                    type="submit"
                    disabled={isSavingName}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingName ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  <button
                    id="cancel-profile-name-btn"
                    type="button"
                    disabled={isSavingName}
                    onClick={() => {
                      setNameInput(user.name);
                      setIsEditingName(false);
                      setNameError(null);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Display Name</span>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Email Address</span>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-2.5 h-2.5" /> Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Account Role</span>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 text-slate-600" /> System Administrator
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-3 h-3 text-slate-600" /> Student
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Account ID</span>
                  <p className="text-xs font-mono text-slate-600">{user.id}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => onNavigateToTab('subjects')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <BookOpen className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900 mt-3">Subjects & Lectures</h4>
              <p className="text-xs text-slate-500 mt-0.5">Explore structured curricula and track session progress.</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('coding')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Code className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900 mt-3">Coding Repository</h4>
              <p className="text-xs text-slate-500 mt-0.5">Solve algorithmic problems sorted by topic & difficulty.</p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('calendar')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900 mt-3">Academic Calendar</h4>
              <p className="text-xs text-slate-500 mt-0.5">Plan study milestones and view scheduled tasks.</p>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Password Management */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your account is protected with a secure password of at least 6 characters.
              </p>
            </div>

            {passwordSuccess && (
              <div
                id="password-change-success"
                className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Password successfully changed. Your active session remains authenticated.</span>
              </div>
            )}

            {passwordError && (
              <div
                id="password-change-error"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label
                  htmlFor="current-password-input"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Current Password
                </label>
                <input
                  id="current-password-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password-input"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors text-slate-900"
                  placeholder="Repeat new password"
                />
              </div>

              <div className="pt-2">
                <button
                  id="change-password-submit-btn"
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
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
          </div>
        </div>
      )}

      {/* Tab 3: Role & Capabilities */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                  {user.role === 'admin' ? 'Administrator Capabilities' : 'Student Capabilities'}
                </h3>
                <p className="text-xs text-slate-500">
                  Permissions and feature access assigned to your role.
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
                  Practice Easy, Medium, and Hard algorithmic challenges, filter by topic, track completion rates, and submit code.
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
          </div>
        </div>
      )}
    </div>
  );
}
