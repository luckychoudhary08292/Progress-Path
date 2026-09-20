import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  ShieldPlus,
  ShieldX,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Lock,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AdminUserComparison, AdminSortColumn, SortDirection, User } from '../../types.ts';

interface AdminUsersSectionProps {
  users: AdminUserComparison[];
  totals: {
    usersCount: number;
    lecturesCount: number;
    problemsCount: number;
  } | null;
  currentUser?: User | null;
  isLoading: boolean;
  onRefresh: () => void;
  onRoleActionSuccess?: () => void;
}

export const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({
  users,
  totals,
  currentUser,
  isLoading,
  onRefresh,
  onRoleActionSuccess,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sortColumn, setSortColumn] = useState<AdminSortColumn>('overallReadinessPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Create Admin Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminTempPassword, setNewAdminTempPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [createAdminErrors, setCreateAdminErrors] = useState<Record<string, string>>({});
  const [createAdminSuccess, setCreateAdminSuccess] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);

  // Role Action Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'promote' | 'revoke';
    targetUser: AdminUserComparison;
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleActionFeedback, setRoleActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sorting Handler
  const handleSort = (column: AdminSortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'name' || column === 'email' ? 'asc' : 'desc');
    }
  };

  // Filtered & Sorted Users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [users, roleFilter, searchQuery, sortColumn, sortDirection]);

  // Handle Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminErrors({});
    setCreateAdminSuccess(null);
    setCopiedTempPassword(false);

    const errors: Record<string, string> = {};
    if (!newAdminName.trim()) {
      errors.name = 'Name is required';
    }
    if (!newAdminEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminEmail.trim())) {
      errors.email = 'Valid email address is required';
    }
    if (!newAdminTempPassword) {
      errors.temporaryPassword = 'A temporary password is required';
    } else if (newAdminTempPassword.length < 6) {
      errors.temporaryPassword = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setCreateAdminErrors(errors);
      return;
    }

    setIsCreatingAdmin(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          temporaryPassword: newAdminTempPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setCreateAdminErrors(data.fieldErrors);
        } else {
          setCreateAdminErrors({ general: data.message || 'Failed to create administrator account' });
        }
        return;
      }

      setCreateAdminSuccess({
        name: data.user.name,
        email: data.user.email,
        temporaryPassword: data.temporaryPassword || newAdminTempPassword,
      });

      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminTempPassword('');

      onRefresh();
      if (onRoleActionSuccess) onRoleActionSuccess();
    } catch {
      setCreateAdminErrors({ general: 'Network error occurred while creating admin account.' });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Handle Promote / Revoke Role Update
  const handleRoleAction = async () => {
    if (!confirmModal) return;

    const { type, targetUser } = confirmModal;
    const newRole = type === 'promote' ? 'admin' : 'user';

    setIsUpdatingRole(true);
    setRoleActionFeedback(null);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRoleActionFeedback({
          type: 'error',
          message: data.message || 'Failed to update user role.',
        });
        setIsUpdatingRole(false);
        setConfirmModal(null);
        return;
      }

      setRoleActionFeedback({
        type: 'success',
        message: data.message || `Successfully updated role for ${targetUser.name}.`,
      });

      setConfirmModal(null);
      onRefresh();
      if (onRoleActionSuccess) onRoleActionSuccess();
    } catch {
      setRoleActionFeedback({
        type: 'error',
        message: 'Network error while updating user role.',
      });
      setConfirmModal(null);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {roleActionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            roleActionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {roleActionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{roleActionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setRoleActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Banner & "Create Admin" Trigger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              User Directory & Role Permissions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect student progress benchmarks, manage access privileges, and provision new administrator accounts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFormOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <ShieldPlus className="w-3.5 h-3.5" />
              <span>{isFormOpen ? 'Hide Form' : 'Create Admin Account'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Create Admin Form */}
        {isFormOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <ShieldPlus className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Provision New Administrator Account</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                The provisioned account will strictly require a password change on first login before accessing administrative features.
              </p>

              {createAdminErrors.general && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {createAdminErrors.general}
                </div>
              )}

              {createAdminSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Administrator account successfully created!
                  </div>
                  <div className="text-emerald-700">
                    Share these initial credentials securely with <strong>{createAdminSuccess.name}</strong> ({createAdminSuccess.email}):
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-emerald-200 rounded-lg font-mono text-xs text-slate-800 select-all">
                    <span className="font-semibold text-slate-500">Temporary Password:</span>
                    <span className="font-bold text-slate-900">{createAdminSuccess.temporaryPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createAdminSuccess.temporaryPassword);
                        setCopiedTempPassword(true);
                        setTimeout(() => setCopiedTempPassword(false), 2000);
                      }}
                      className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-[11px] cursor-pointer"
                    >
                      {copiedTempPassword ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTempPassword ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                  {createAdminErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1">{createAdminErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="e.g. alex@lms.local"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                  {createAdminErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{createAdminErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temporary Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewAdminPassword ? 'text' : 'password'}
                      value={newAdminTempPassword}
                      onChange={(e) => setNewAdminTempPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAdminPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {createAdminErrors.temporaryPassword && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      {createAdminErrors.temporaryPassword}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setCreateAdminErrors({});
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAdmin}
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-xs"
                  >
                    {isCreatingAdmin && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Create Administrator</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 mt-4 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admins Only ({users.filter((u) => u.role === 'admin').length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('user')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                roleFilter === 'user'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Students Only ({users.filter((u) => u.role !== 'admin').length})
            </button>
          </div>
        </div>
      </div>

      {/* Users Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 font-semibold">{filteredAndSortedUsers.length}</strong>{' '}
            of <strong className="text-slate-900 font-semibold">{users.length}</strong> registered users
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredAndSortedUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700">No users match your current filter criteria</p>
            <p className="text-slate-400 mt-1">Try broadening your search term or selecting "All Users".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>User</span>
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4 font-semibold text-center">Role Status</th>

                  <th
                    onClick={() => handleSort('lecturesCompletedPercent')}
                    className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Lectures</span>
                      {sortColumn === 'lecturesCompletedPercent' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('problemsSolvedPercent')}
                    className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Problems</span>
                      {sortColumn === 'problemsSolvedPercent' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('overallReadinessPercent')}
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Readiness</span>
                      {sortColumn === 'overallReadinessPercent' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4 font-semibold text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedUsers.map((user) => {
                  const isCurrent = currentUser && currentUser.id === user.id;
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isAdmin ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                            {user.mustChangePassword && (
                              <span className="text-[10px] text-amber-600 font-medium inline-flex items-center gap-1">
                                <KeyRound className="w-2.5 h-2.5" />
                                Temporary Pwd
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Student
                          </span>
                        )}
                      </td>

                      {/* Lectures Progress */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium text-slate-800">
                          {user.lecturesDone}{' '}
                          <span className="text-slate-400 font-normal">/ {user.totalLectures}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {user.lecturesCompletedPercent}%
                        </div>
                      </td>

                      {/* Problems Progress */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium text-slate-800">
                          {user.problemsSolved}{' '}
                          <span className="text-slate-400 font-normal">/ {user.totalProblems}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {user.problemsSolvedPercent}%
                        </div>
                      </td>

                      {/* Overall Readiness */}
                      <td className="py-3 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">
                              {user.overallReadinessPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                user.overallReadinessPercent >= 80
                                  ? 'bg-emerald-500'
                                  : user.overallReadinessPercent >= 40
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, user.overallReadinessPercent))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Access Controls */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isCurrent ? (
                          <span className="text-[11px] text-slate-400 italic">Self (Locked)</span>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ type: 'revoke', targetUser: user })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <ShieldX className="w-3 h-3" />
                            <span>Revoke Admin</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ type: 'promote', targetUser: user })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <ShieldPlus className="w-3 h-3" />
                            <span>Promote to Admin</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                confirmModal.type === 'promote'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {confirmModal.type === 'promote' ? (
                <ShieldPlus className="w-5 h-5" />
              ) : (
                <ShieldX className="w-5 h-5" />
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {confirmModal.type === 'promote'
                ? `Promote ${confirmModal.targetUser.name} to Administrator?`
                : `Revoke Admin Access for ${confirmModal.targetUser.name}?`}
            </h3>

            <p className="text-xs text-slate-500 mt-2">
              {confirmModal.type === 'promote'
                ? `This user will gain full system administration privileges, including user management, role assignments, and global curriculum editing.`
                : `This user will revert to a standard student account and will immediately lose access to the administrative control center.`}
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleAction}
                disabled={isUpdatingRole}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5 ${
                  confirmModal.type === 'promote'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isUpdatingRole && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>
                  {confirmModal.type === 'promote' ? 'Confirm Promotion' : 'Confirm Revocation'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
