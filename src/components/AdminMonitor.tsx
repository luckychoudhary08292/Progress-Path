import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  Users,
  Layers,
  Clock,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import {
  User,
  AdminSection,
  AdminOverviewMetrics,
  MostActiveUser,
  AuditLogEntry,
  AdminUserComparison,
  GlobalSubjectItem,
  GlobalLectureItem,
  GlobalProblemItem,
  ProblemDifficulty,
} from '../types.ts';
import { AdminOverviewSection } from './admin/AdminOverviewSection.tsx';
import { AdminUsersSection } from './admin/AdminUsersSection.tsx';
import { AdminContentSection } from './admin/AdminContentSection.tsx';
import { AdminActivityLogSection } from './admin/AdminActivityLogSection.tsx';

interface AdminMonitorProps {
  currentUser?: User | null;
  onNavigateToDashboard?: () => void;
}

export function AdminMonitor({ currentUser, onNavigateToDashboard }: AdminMonitorProps) {
  // Active Section Tab (Default is 'overview')
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Error & Access Guard
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Lazy loading state tracker
  const [loadedSections, setLoadedSections] = useState<Record<AdminSection, boolean>>({
    overview: false,
    users: false,
    content: false,
    activity: false,
  });

  // Section 1: Overview Data
  const [overviewMetrics, setOverviewMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [mostActiveUsers, setMostActiveUsers] = useState<MostActiveUser[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Section 2: Users Data
  const [users, setUsers] = useState<AdminUserComparison[]>([]);
  const [userTotals, setUserTotals] = useState<{
    usersCount: number;
    lecturesCount: number;
    problemsCount: number;
  } | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Section 3: Content Data
  const [globalSubjects, setGlobalSubjects] = useState<GlobalSubjectItem[]>([]);
  const [globalLectures, setGlobalLectures] = useState<GlobalLectureItem[]>([]);
  const [globalProblems, setGlobalProblems] = useState<GlobalProblemItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Section 4: Activity Log Data
  const [allAuditLogs, setAllAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Get Auth Token Helper
  const getAuthToken = () => localStorage.getItem('auth_token');

  // ----------------------------------------------------------------------
  // Fetch Handlers (Lazy Loaded per section)
  // ----------------------------------------------------------------------

  // 1. Fetch Overview
  const fetchOverviewData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setErrorStatus(401);
      setErrorMessage('Authentication required. Please log in.');
      return;
    }

    try {
      setIsLoadingOverview(true);
      setErrorStatus(null);

      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setErrorStatus(403);
        setErrorMessage('Access Denied: Administrator privileges are required to view this panel.');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || 'Failed to fetch overview metrics');
        return;
      }

      const data = await res.json();
      setOverviewMetrics(data.metrics || null);
      setMostActiveUsers(data.mostActiveUsers || []);
      setRecentAuditLogs(data.recentAuditLogs || []);
      setLoadedSections((prev) => ({ ...prev, overview: true }));
    } catch {
      setErrorStatus(500);
      setErrorMessage('Network error connecting to the admin API');
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  // 2. Fetch Users
  const fetchUsersData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoadingUsers(true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setErrorStatus(403);
        setErrorMessage('Access Denied: Administrator privileges required.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setUserTotals(data.totals || null);
        setLoadedSections((prev) => ({ ...prev, users: true }));
      }
    } catch (err) {
      console.error('Failed to fetch users data:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // 3. Fetch Content
  const fetchContentData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoadingContent(true);
      const res = await fetch('/api/admin/content', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setErrorStatus(403);
        setErrorMessage('Access Denied: Administrator privileges required.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setGlobalSubjects(data.subjects || []);
        setGlobalLectures(data.lectures || []);
        setGlobalProblems(data.problems || []);
        setLoadedSections((prev) => ({ ...prev, content: true }));
      }
    } catch (err) {
      console.error('Failed to fetch content data:', err);
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  // 4. Fetch Activity Logs
  const fetchActivityLogs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setErrorStatus(403);
        setErrorMessage('Access Denied: Administrator privileges required.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setAllAuditLogs(data.logs || []);
        setLoadedSections((prev) => ({ ...prev, activity: true }));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Lazy loading triggered on active section change
  useEffect(() => {
    if (activeSection === 'overview' && !loadedSections.overview) {
      fetchOverviewData();
    } else if (activeSection === 'users' && !loadedSections.users) {
      fetchUsersData();
    } else if (activeSection === 'content' && !loadedSections.content) {
      fetchContentData();
    } else if (activeSection === 'activity' && !loadedSections.activity) {
      fetchActivityLogs();
    }
  }, [
    activeSection,
    loadedSections,
    fetchOverviewData,
    fetchUsersData,
    fetchContentData,
    fetchActivityLogs,
  ]);

  // Initial mount: load overview tab
  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // ----------------------------------------------------------------------
  // Content Management API Actions
  // ----------------------------------------------------------------------

  // Subject Actions
  const handleCreateSubject = async (name: string): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch('/api/admin/content/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create global subject');
    }
    await fetchContentData();
    // Refresh overview metrics in background if loaded
    if (loadedSections.overview) fetchOverviewData();
    return true;
  };

  const handleUpdateSubject = async (id: string, name: string): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch(`/api/admin/content/subjects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update global subject');
    }
    await fetchContentData();
    return true;
  };

  const handleDeleteSubject = async (id: string): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch(`/api/admin/content/subjects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete global subject');
    }
    await fetchContentData();
    if (loadedSections.overview) fetchOverviewData();
    return true;
  };

  // Lecture Actions
  const handleCreateLecture = async (
    subjectId: string,
    title: string,
    session?: number,
    videoUrl?: string
  ): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch('/api/admin/content/lectures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subjectId, title, session, videoUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create global lecture');
    }
    await fetchContentData();
    if (loadedSections.overview) fetchOverviewData();
    return true;
  };

  const handleUpdateLecture = async (
    id: string,
    data: { title?: string; session?: number; videoUrl?: string }
  ): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch(`/api/admin/content/lectures/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update global lecture');
    }
    await fetchContentData();
    return true;
  };

  const handleDeleteLecture = async (id: string): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch(`/api/admin/content/lectures/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete global lecture');
    }
    await fetchContentData();
    if (loadedSections.overview) fetchOverviewData();
    return true;
  };

  // Problem Actions
  const handleCreateProblem = async (
    name: string,
    difficulty: ProblemDifficulty,
    category: string,
    link?: string
  ): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch('/api/admin/content/problems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, difficulty, category, link }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create global problem');
    }
    await fetchContentData();
    if (loadedSections.overview) fetchOverviewData();
    return true;
  };

  const handleUpdateProblem = async (
    id: string,
    data: { name?: string; difficulty?: ProblemDifficulty; category?: string; link?: string }
  ): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch(`/api/admin/content/problems/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update global problem');
    }
    await fetchContentData();
    return true;
  };

  const handleDeleteProblem = async (id: string): Promise<boolean> => {
    const token = getAuthToken();
    const res = await fetch(`/api/admin/content/problems/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete global problem');
    }
    await fetchContentData();
    if (loadedSections.overview) fetchOverviewData();
    return true;
  };

  // ----------------------------------------------------------------------
  // Security / Error Screens
  // ----------------------------------------------------------------------
  if (errorStatus === 403) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Administrator Access Required</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Your current account role does not possess administrative privileges. Only authenticated
            administrators may access the administrative control center.
          </p>
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pb-12 space-y-6">
      {/* Admin Panel Header & Sub-Nav */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              {onNavigateToDashboard && (
                <>
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="hover:text-slate-700 cursor-pointer"
                  >
                    Portal
                  </button>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-slate-600 font-semibold">Administration</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h1>
            </div>
          </div>

          {/* Sub-Nav Tabs matching main app style */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {/* 1. Overview Tab */}
            <button
              id="admin-tab-overview"
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Overview</span>
            </button>

            {/* 2. Users Tab */}
            <button
              id="admin-tab-users"
              type="button"
              onClick={() => setActiveSection('users')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'users'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Users</span>
              {userTotals && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {userTotals.usersCount}
                </span>
              )}
            </button>

            {/* 3. Content Tab */}
            <button
              id="admin-tab-content"
              type="button"
              onClick={() => setActiveSection('content')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'content'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Content</span>
              {overviewMetrics && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  {overviewMetrics.totalContentItems}
                </span>
              )}
            </button>

            {/* 4. Activity Log Tab */}
            <button
              id="admin-tab-activity"
              type="button"
              onClick={() => setActiveSection('activity')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'activity'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Activity Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION VIEW CONTAINER (Lazy Loaded) */}
      <div>
        {activeSection === 'overview' && (
          <AdminOverviewSection
            metrics={overviewMetrics}
            mostActiveUsers={mostActiveUsers}
            recentAuditLogs={recentAuditLogs}
            isLoading={isLoadingOverview}
            onRefresh={fetchOverviewData}
            onNavigateToSection={(sec) => setActiveSection(sec)}
          />
        )}

        {activeSection === 'users' && (
          <AdminUsersSection
            users={users}
            totals={userTotals}
            currentUser={currentUser}
            isLoading={isLoadingUsers}
            onRefresh={fetchUsersData}
            onRoleActionSuccess={() => {
              if (loadedSections.activity) fetchActivityLogs();
              if (loadedSections.overview) fetchOverviewData();
            }}
          />
        )}

        {activeSection === 'content' && (
          <AdminContentSection
            subjects={globalSubjects}
            lectures={globalLectures}
            problems={globalProblems}
            isLoading={isLoadingContent}
            onRefresh={fetchContentData}
            onCreateSubject={handleCreateSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onCreateLecture={handleCreateLecture}
            onUpdateLecture={handleUpdateLecture}
            onDeleteLecture={handleDeleteLecture}
            onCreateProblem={handleCreateProblem}
            onUpdateProblem={handleUpdateProblem}
            onDeleteProblem={handleDeleteProblem}
          />
        )}

        {activeSection === 'activity' && (
          <AdminActivityLogSection
            logs={allAuditLogs}
            isLoading={isLoadingLogs}
            onRefresh={fetchActivityLogs}
          />
        )}
      </div>
    </div>
  );
}
export default AdminMonitor;
