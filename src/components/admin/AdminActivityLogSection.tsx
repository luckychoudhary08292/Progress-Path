import React, { useState, useMemo } from 'react';
import {
  Clock,
  Shield,
  ShieldPlus,
  ShieldX,
  KeyRound,
  RefreshCw,
  Search,
  Layers,
  Filter,
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AuditLogEntry } from '../../types.ts';

interface AdminActivityLogSectionProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AdminActivityLogSection: React.FC<AdminActivityLogSectionProps> = ({
  logs,
  isLoading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Action type filter
      if (selectedActionFilter !== 'all') {
        if (selectedActionFilter === 'roles') {
          if (!['create_admin', 'promote_admin', 'revoke_admin'].includes(log.action)) {
            return false;
          }
        } else if (selectedActionFilter === 'content') {
          if (
            ![
              'create_global_content',
              'update_global_content',
              'delete_global_content',
            ].includes(log.action)
          ) {
            return false;
          }
        } else if (selectedActionFilter === 'security') {
          if (!['first_login_password_changed', 'bootstrap_initial_admin'].includes(log.action)) {
            return false;
          }
        } else if (log.action !== selectedActionFilter) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actorMatch =
          log.actorName.toLowerCase().includes(q) ||
          (log.actorEmail && log.actorEmail.toLowerCase().includes(q));
        const targetMatch = log.targetEmail && log.targetEmail.toLowerCase().includes(q);
        const detailsMatch = log.details.toLowerCase().includes(q);
        const actionMatch = log.action.toLowerCase().includes(q);

        if (!actorMatch && !targetMatch && !detailsMatch && !actionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedActionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldPlus className="w-3 h-3" />
            Admin Created
          </span>
        );
      case 'promote_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3 h-3" />
            Promoted
          </span>
        );
      case 'revoke_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldX className="w-3 h-3" />
            Revoked
          </span>
        );
      case 'first_login_password_changed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <KeyRound className="w-3 h-3" />
            Password Set
          </span>
        );
      case 'create_global_content':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Layers className="w-3 h-3" />
            Content Added
          </span>
        );
      case 'update_global_content':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3 h-3" />
            Content Edited
          </span>
        );
      case 'delete_global_content':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Content Deleted
          </span>
        );
      case 'bootstrap_initial_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            System Bootstrap
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      return {
        dateStr: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        timeStr: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
    } catch {
      return { dateStr: timestampStr, timeStr: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Administrative Activity & Audit Log
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological ledger of role promotions, administrator provisioning, password resets, and shared content changes.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, target email, or details..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setSelectedActionFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedActionFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedActionFilter('roles')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedActionFilter === 'roles'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Roles & Admins
            </button>
            <button
              type="button"
              onClick={() => setSelectedActionFilter('content')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedActionFilter === 'content'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Global Content
            </button>
            <button
              type="button"
              onClick={() => setSelectedActionFilter('security')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedActionFilter === 'security'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Security
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 font-semibold">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-900 font-semibold">{logs.length}</strong> recorded actions
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

        {isLoading && logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-xs font-medium">Fetching secure audit trail from server...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700">No activity logs matching your filter</p>
            <p className="text-slate-400 mt-1">Try searching with a different term or reset your action filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Target / Subject</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const { dateStr, timeStr } = formatTimestamp(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{dateStr}</div>
                        <div className="text-[11px] text-slate-400">{timeStr}</div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.actorName}</div>
                        {log.actorEmail && (
                          <div className="text-[11px] text-slate-400">{log.actorEmail}</div>
                        )}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.targetEmail ? (
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                            {log.targetEmail}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 max-w-md">
                        <p className="text-xs text-slate-700 leading-relaxed break-words">
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
