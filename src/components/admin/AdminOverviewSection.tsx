import React from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Shield,
  Layers,
  Code2,
  ArrowRight,
  Clock,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { AdminOverviewMetrics, MostActiveUser, AuditLogEntry, AdminSection } from '../../types.ts';

interface AdminOverviewSectionProps {
  metrics: AdminOverviewMetrics | null;
  mostActiveUsers: MostActiveUser[];
  recentAuditLogs: AuditLogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateToSection: (section: AdminSection) => void;
}

export const AdminOverviewSection: React.FC<AdminOverviewSectionProps> = ({
  metrics,
  mostActiveUsers,
  recentAuditLogs,
  isLoading,
  onRefresh,
  onNavigateToSection,
}) => {
  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-xs">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading system overview and statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Admin Control Center</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Overview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform metrics, user engagement, and curriculum assets.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-60"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics?.totalUsers ?? 0}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 text-indigo-700 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                <Shield className="w-3 h-3" />
                {metrics?.totalAdmins ?? 0} Admins
              </span>
              <span>•</span>
              <span>{metrics?.totalStandardUsers ?? 0} Students</span>
            </div>
          </div>
        </div>

        {/* Global Curriculum Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global Content</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics?.totalContentItems ?? 0}</div>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px] text-slate-600">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">{metrics?.globalSubjectsCount ?? 0} Subjects</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">{metrics?.globalLecturesCount ?? 0} Lectures</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">{metrics?.globalProblemsCount ?? 0} Problems</span>
            </div>
          </div>
        </div>

        {/* Total Progress Completions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{metrics?.totalProgressCompleted ?? 0}</div>
            <p className="text-xs text-slate-500 mt-2">
              Verified lectures & coding problems marked complete
            </p>
          </div>
        </div>

        {/* Active Learners This Week */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active This Week</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {mostActiveUsers.filter((u) => u.totalCompletedThisWeek > 0).length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Users with progress recorded in the last 7 days
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Most Active Users (70%) + Quick Audit & Navigation (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Active Users Table (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Most Active Users This Week
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students and users ranked by weekly lecture and problem completions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToSection('users')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all users</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {mostActiveUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No user progress recorded yet this week.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold text-center">Lectures</th>
                    <th className="py-3 px-4 font-semibold text-center">Problems</th>
                    <th className="py-3 px-4 font-semibold text-center">Weekly Done</th>
                    <th className="py-3 px-4 font-semibold text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mostActiveUsers.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-slate-400 font-bold text-[11px] text-center">
                            #{idx + 1}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {user.completedLectures}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {user.solvedProblems}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {user.totalCompletedThisWeek}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Side Panel: Quick Navigation & Recent Audit Snapshot */}
        <div className="space-y-6">
          {/* Quick Section Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Admin Quick Actions</h3>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigateToSection('users')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                      Users & Roles
                    </div>
                    <div className="text-[11px] text-slate-500">Manage admins, passwords & progress</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToSection('content')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                      Global Content
                    </div>
                    <div className="text-[11px] text-slate-500">Curate shared subjects, lectures & coding</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToSection('activity')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-200 hover:bg-amber-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-amber-800">
                      Activity Log
                    </div>
                    <div className="text-[11px] text-slate-500">Audit trail of promotions and updates</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
              </button>
            </div>
          </div>

          {/* Recent Audit Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Recent Audit Trail
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToSection('activity')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                View all
              </button>
            </div>

            {recentAuditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No activity logged yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAuditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-indigo-400 pl-2.5 py-0.5">
                    <div className="font-semibold text-slate-800 line-clamp-1">{log.details}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{log.actorName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
