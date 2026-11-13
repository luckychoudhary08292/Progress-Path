import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Reusable shimmer skeleton block matching light & pure-black themes.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`skeleton-block rounded-md ${className}`}
  />
);

/**
 * Dashboard page skeleton matching header, 4 metric cards, and schedule list.
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="w-full space-y-2 sm:space-y-6" aria-busy="true" aria-label="Loading dashboard">
    {/* Desktop Welcome Bar Skeleton */}
    <div className="hidden sm:flex bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex-row items-center justify-between gap-4">
      <div className="space-y-2.5 flex-1">
        <Skeleton className="h-7 w-56 rounded-lg" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>

    {/* 4 Stat Cards Skeleton (2x2 on mobile, 4-col on desktop) */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 sm:w-24" />
            <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 rounded-md" />
          </div>
          <div className="mt-3 sm:mt-5 space-y-2">
            <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-lg" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>

    {/* Today's Schedule & Tasks Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-6">
      <div className="flex items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="sm:hidden w-7 h-7 rounded-full" />
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-3/5' : 'w-2/5'}`} />
            </div>
            <Skeleton className="h-5 w-14 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Full workspace shell skeleton rendered while verifying stored session on reload.
 */
export const AppShellSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full" aria-busy="true" aria-label="Loading workspace">
    {/* Top Nav Skeleton */}
    <div className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-black/95 border-b border-slate-200 dark:border-zinc-800 h-14 md:h-15">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24 rounded-lg hidden sm:block" />
          <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
          <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
        </div>
      </div>
    </div>

    <div className="h-14 md:h-15 w-full shrink-0 mb-2.5 sm:mb-5 md:mb-6" aria-hidden="true" />

    <main className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 flex-1 pb-24 md:pb-12">
      <DashboardSkeleton />
    </main>

    {/* Mobile Bottom Nav Skeleton */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 border-t border-slate-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-around">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-10 h-2.5 rounded" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Subjects Hub skeleton matching the header and 2/3/4 column subject card grid.
 */
export const SubjectsHubSkeleton: React.FC = () => (
  <div className="w-full space-y-2 sm:space-y-6" aria-busy="true" aria-label="Loading subjects">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-3.5 sm:p-6 rounded-xl shadow-xs">
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-5 sm:h-7 w-44 sm:w-64 rounded-lg" />
        <Skeleton className="hidden sm:block h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="w-8 h-8 sm:w-32 sm:h-9 rounded-full sm:rounded-lg shrink-0" />
    </div>

    {/* Subject Cards Grid Skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-5 flex flex-col justify-between space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-14 rounded" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-5 w-10 rounded-md" />
            </div>
          </div>
          <div className="space-y-1.5 py-1">
            <Skeleton className="h-4 sm:h-5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <div className="hidden sm:block space-y-2 pt-1">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Subject Detail skeleton matching the compact header, filter toolbar, and topic rows.
 */
export const SubjectDetailSkeleton: React.FC = () => (
  <div className="w-full space-y-2 sm:space-y-6" aria-busy="true" aria-label="Loading topic checklist">
    {/* Header Card Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <Skeleton className="h-5 sm:h-6 w-44 sm:w-64" />
          <Skeleton className="h-5 w-14 rounded-md shrink-0" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      </div>
      <Skeleton className="w-full h-1 mt-2.5 rounded-full" />
    </div>

    {/* Toolbar Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
        <Skeleton className="h-9 w-16 sm:w-24 rounded-lg shrink-0" />
      </div>
    </div>

    {/* Checklist Rows Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className="h-5 w-9 rounded shrink-0" />
            <Skeleton className={`h-4 ${i % 3 === 0 ? 'w-2/3' : i % 3 === 1 ? 'w-1/2' : 'w-3/5'}`} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="w-16 h-7 rounded-lg hidden sm:block" />
            <Skeleton className="w-8 h-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Coding Repository skeleton matching header, search/filter bar, and problem rows.
 */
export const CodingRepositorySkeleton: React.FC = () => (
  <div className="w-full space-y-2 sm:space-y-6" aria-busy="true" aria-label="Loading coding repository">
    {/* Header Bar Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 sm:h-7 w-40 sm:w-56" />
          <Skeleton className="hidden sm:block h-4 w-80 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-8 sm:h-9 w-16 sm:w-28 rounded-lg shrink-0" />
    </div>

    {/* Search & Filter Toolbar Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
      </div>
    </div>

    {/* Problems List Skeleton */}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="px-2.5 sm:px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Skeleton className="h-6 w-20 rounded-md shrink-0" />
            <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-1/2' : 'w-2/5'}`} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-5 w-14 rounded hidden sm:block" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="w-6 h-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Calendar month 7x5 grid skeleton matching cell aspect-square dimensions.
 */
export const CalendarGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-7 gap-1 sm:gap-1.5" aria-busy="true" aria-label="Loading calendar days">
    {Array.from({ length: 35 }).map((_, i) => (
      <Skeleton
        key={i}
        className="aspect-square min-h-[40px] sm:min-h-[52px] xl:min-h-[64px] w-full rounded-lg"
      />
    ))}
  </div>
);

/**
 * Calendar daily tasks panel skeleton when loading events.
 */
export const CalendarSidePanelSkeleton: React.FC = () => (
  <div className="space-y-2" aria-busy="true" aria-label="Loading scheduled items">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="p-2.5 sm:p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Skeleton className="w-4 h-4 rounded-full shrink-0" />
          <Skeleton className={`h-3.5 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
        </div>
        <Skeleton className="h-4 w-12 rounded shrink-0" />
      </div>
    ))}
  </div>
);

/**
 * Notifications Drawer list skeleton.
 */
export const NotificationsDrawerSkeleton: React.FC = () => (
  <div className="space-y-2.5" aria-busy="true" aria-label="Loading notifications">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 space-y-2">
        <div className="flex items-start gap-3">
          <Skeleton className="w-7 h-7 rounded-lg shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Admin Overview Dashboard skeleton.
 */
export const AdminOverviewSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading admin overview">
    <div className="flex items-center justify-between gap-3 pt-1 pb-1">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-3.5 w-36" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, colIdx) => (
        <div key={colIdx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div key={rowIdx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-5 w-12 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Reusable Admin Table rows skeleton (Users, Content, Activity Log).
 */
export const AdminTableRowsSkeleton: React.FC<{ columns?: number; rows?: number }> = ({
  columns = 5,
  rows = 6,
}) => (
  <div className="overflow-x-auto" aria-busy="true" aria-label="Loading table rows">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 border-b border-slate-100">
        <tr>
          {Array.from({ length: columns }).map((_, c) => (
            <th key={c} className="py-3 px-4">
              <Skeleton className="h-3 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c} className="py-3.5 px-4">
                {c === 0 ? (
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                ) : (
                  <Skeleton className={`h-3.5 ${c === columns - 1 ? 'w-16 ml-auto' : 'w-20'}`} />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Admin Feedback list skeleton.
 */
export const AdminFeedbackSkeleton: React.FC = () => (
  <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Loading feedback submissions">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
      </div>
    ))}
  </div>
);

/**
 * System Security & Database Diagnostic modal body skeleton.
 */
export const SystemSecuritySkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading system diagnostics">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    ))}
  </div>
);
