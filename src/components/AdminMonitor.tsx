import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Users,
  GraduationCap,
  Code2,
  TrendingUp,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AdminUserComparison, AdminSortColumn, SortDirection } from '../types.ts';

interface AdminMonitorProps {
  onNavigateToDashboard?: () => void;
}

export function AdminMonitor({ onNavigateToDashboard }: AdminMonitorProps) {
  const [users, setUsers] = useState<AdminUserComparison[]>([]);
  const [totals, setTotals] = useState<{
    usersCount: number;
    lecturesCount: number;
    problemsCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state: default to overallReadinessPercent descending
  const [sortColumn, setSortColumn] = useState<AdminSortColumn>('overallReadinessPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchAdminData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setErrorStatus(401);
      setErrorMessage('Authentication required. Please log in.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorStatus(null);
      setErrorMessage('');

      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        setErrorStatus(403);
        setErrorMessage('Access Denied: Administrator privileges are required to view this monitor.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorStatus(res.status);
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.message || 'Failed to fetch admin monitor data');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTotals(data.totals || null);
    } catch {
      setErrorStatus(500);
      setErrorMessage('Network error connecting to the admin monitor API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handle header click to sort
  const handleSort = (column: AdminSortColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // New column: strings default to asc, percentages default to desc
      setSortColumn(column);
      if (column === 'name' || column === 'email') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  // Filtered & Sorted Users
  const processedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = users.filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortColumn === 'lecturesCompletedPercent') {
        comparison = a.lecturesCompletedPercent - b.lecturesCompletedPercent;
      } else if (sortColumn === 'problemsSolvedPercent') {
        comparison = a.problemsSolvedPercent - b.problemsSolvedPercent;
      } else if (sortColumn === 'overallReadinessPercent') {
        comparison = a.overallReadinessPercent - b.overallReadinessPercent;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [users, searchQuery, sortColumn, sortDirection]);

  // Overall Average Readiness
  const averageReadiness = useMemo(() => {
    if (users.length === 0) return '0.0%';
    const sum = users.reduce((acc, curr) => acc + curr.overallReadinessPercent, 0);
    return (sum / users.length).toFixed(1) + '%';
  }, [users]);

  // If 403 Forbidden
  if (errorStatus === 403) {
    return (
      <div id="admin-403-container" className="w-full max-w-lg mx-auto py-16 px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 id="admin-403-title" className="text-base font-semibold text-slate-900 mb-2">
            Admin Access Restricted
          </h2>
          <p id="admin-403-description" className="text-xs text-slate-500 leading-relaxed mb-6">
            This console is reserved for administrator accounts.
            Your current account credentials do not have permission to view peer metrics.
          </p>
          {onNavigateToDashboard && (
            <button
              id="admin-403-back-btn"
              type="button"
              onClick={onNavigateToDashboard}
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Return to Student Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Clear initial loading state
  if (isLoading && users.length === 0 && !errorMessage) {
    return (
      <div id="admin-initial-loading" className="w-full max-w-6xl mx-auto py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <p className="text-xs font-medium text-slate-500">Loading performance metrics...</p>
      </div>
    );
  }

  return (
    <div id="admin-monitor-container" className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="admin-page-heading" className="text-lg font-semibold tracking-tight text-slate-900">
                User Performance Monitor
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-100 text-slate-600 border border-slate-200">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cross-user comparison of curriculum completion, problem solving, and readiness metrics
            </p>
          </div>
        </div>

        {/* Refresh & Quick Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="admin-refresh-data-btn"
            type="button"
            onClick={fetchAdminData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Total Users</p>
            <p id="admin-metric-total-users" className="text-xl font-semibold text-slate-900 font-mono">
              {users.length}
            </p>
          </div>
        </div>

        {/* Metric 2: Average Readiness */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Avg Overall Readiness</p>
            <p id="admin-metric-avg-readiness" className="text-xl font-semibold text-emerald-600 font-mono">
              {averageReadiness}
            </p>
          </div>
        </div>

        {/* Metric 3: Curriculum Lectures Benchmark */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Curriculum Lectures</p>
            <p id="admin-metric-total-lectures" className="text-xl font-semibold text-slate-900 font-mono">
              {totals?.lecturesCount ?? 0}
            </p>
          </div>
        </div>

        {/* Metric 4: Coding Problems Benchmark */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Repository Problems</p>
            <p id="admin-metric-total-problems" className="text-xl font-semibold text-slate-900 font-mono">
              {totals?.problemsCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <section
        id="admin-comparison-card"
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        {/* Search & Sort Status Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-user-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
            <span>Sort:</span>
            <span id="admin-active-sort-badge" className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {sortColumn === 'name' && 'Name'}
              {sortColumn === 'email' && 'Email'}
              {sortColumn === 'lecturesCompletedPercent' && 'Lectures %'}
              {sortColumn === 'problemsSolvedPercent' && 'Problems %'}
              {sortColumn === 'overallReadinessPercent' && 'Readiness %'}{' '}
              ({sortDirection === 'asc' ? 'Asc' : 'Desc'})
            </span>
          </div>
        </div>

        {/* Responsive Table Wrapper with Horizontal Scrolling */}
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">Loading user metrics...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center text-xs text-rose-600">{errorMessage}</div>
          ) : processedUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {searchQuery ? 'No users matching your search query' : 'No registered users found'}
            </div>
          ) : (
            <table id="admin-users-table" className="min-w-[720px] w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 select-none">
                  {/* Column 1: Name */}
                  <th
                    id="th-sort-name"
                    scope="col"
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-slate-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-slate-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Column 2: Email */}
                  <th
                    id="th-sort-email"
                    scope="col"
                    onClick={() => handleSort('email')}
                    className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email</span>
                      {sortColumn === 'email' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-slate-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-slate-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Column 3: Lectures Completed % */}
                  <th
                    id="th-sort-lectures"
                    scope="col"
                    onClick={() => handleSort('lecturesCompletedPercent')}
                    className="py-2.5 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Lectures Completed</span>
                      {sortColumn === 'lecturesCompletedPercent' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-slate-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-slate-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Column 4: Problems Solved % */}
                  <th
                    id="th-sort-problems"
                    scope="col"
                    onClick={() => handleSort('problemsSolvedPercent')}
                    className="py-2.5 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Problems Solved</span>
                      {sortColumn === 'problemsSolvedPercent' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-slate-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-slate-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  {/* Column 5: Overall Readiness % */}
                  <th
                    id="th-sort-readiness"
                    scope="col"
                    onClick={() => handleSort('overallReadinessPercent')}
                    className="py-2.5 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Overall Readiness</span>
                      {sortColumn === 'overallReadinessPercent' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-slate-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-slate-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs bg-white">
                {processedUsers.map((userRow) => {
                  return (
                    <tr
                      key={userRow.id}
                      id={`admin-user-row-${userRow.id}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name + Role badge */}
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{userRow.name}</span>
                          {userRow.role === 'admin' && (
                            <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase bg-slate-100 text-slate-600 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">
                        {userRow.email}
                      </td>

                      {/* Lectures Completed % */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-slate-800 font-medium">
                            {userRow.lecturesCompletedPercent.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {userRow.lecturesDone}/{userRow.totalLectures}
                          </span>
                        </div>
                      </td>

                      {/* Problems Solved % */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-slate-800 font-medium">
                            {userRow.problemsSolvedPercent.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {userRow.problemsSolved}/{userRow.totalProblems}
                          </span>
                        </div>
                      </td>

                      {/* Overall Readiness % */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              userRow.overallReadinessPercent >= 75
                                ? 'text-emerald-700'
                                : userRow.overallReadinessPercent >= 40
                                ? 'text-amber-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {userRow.overallReadinessPercent.toFixed(1)}%
                          </span>

                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                userRow.overallReadinessPercent >= 75
                                  ? 'bg-emerald-500'
                                  : userRow.overallReadinessPercent >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.min(100, userRow.overallReadinessPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
