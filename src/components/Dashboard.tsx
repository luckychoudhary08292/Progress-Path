import { useState, useEffect } from 'react';
import { LogOut, CheckCircle2, Circle, Calendar, BookOpen, Code, Award, Loader2, Sparkles, User as UserIcon } from 'lucide-react';
import { User, DashboardStats, TodayEvent } from '../types.ts';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateToSubjects?: () => void;
  onNavigateToProblems?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToProfile?: () => void;
}

export function Dashboard({
  user,
  onLogout,
  onNavigateToSubjects,
  onNavigateToProblems,
  onNavigateToCalendar,
  onNavigateToProfile,
}: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Format today's date for display and API query
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const formattedDisplayDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/dashboard?date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data: DashboardStats = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleEvent = async (event: TodayEvent) => {
    const token = localStorage.getItem('auth_token');
    if (!token || togglingId) return;

    setTogglingId(event.id);

    // Optimistic UI update
    const newCompleted = !event.completed;
    setStats((prev) => {
      if (!prev) return prev;
      const updatedEvents = prev.todayEvents.map((e) =>
        e.id === event.id ? { ...e, completed: newCompleted } : e
      );
      const doneCount = updatedEvents.filter((e) => e.completed).length;
      return {
        ...prev,
        todayTasks: {
          ...prev.todayTasks,
          done: doneCount,
        },
        todayEvents: updatedEvents,
      };
    });

    try {
      const res = await fetch(`/api/dashboard/events/${event.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Revert on failure
        fetchDashboardData();
      }
    } catch {
      fetchDashboardData();
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading your progress...</p>
      </div>
    );
  }

  const readiness = stats?.readinessPercent ?? 0;
  const lectures = stats?.lectures ?? { done: 0, total: 0 };
  const problems = stats?.problems ?? { solved: 0, total: 0 };
  const todayTasks = stats?.todayTasks ?? { done: 0, total: 0 };
  const todayEvents = stats?.todayEvents ?? [];
  const hasZeroData = stats?.hasZeroData ?? true;

  return (
    <div id="dashboard-container" className="w-full space-y-6">
      {/* Top Welcome Bar */}
      <header className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="dashboard-welcome-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Academic progress overview and today's schedule
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {formattedDisplayDate}
          </span>
          {onNavigateToCalendar && (
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Calendar</span>
            </button>
          )}
        </div>
      </header>

      {/* Friendly Zero Data Helper Notice */}
      {hasZeroData && (
        <div
          id="zero-data-notice"
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Get started by creating your first subject
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Add curriculum topics, lectures, and coding practice to begin tracking your exam readiness.
              </p>
            </div>
          </div>

          {onNavigateToSubjects && (
            <button
              type="button"
              onClick={onNavigateToSubjects}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Go to Subjects</span>
            </button>
          )}
        </div>
      )}

      {/* Four Stat Cards */}
      <section aria-label="Progress Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Readiness % */}
        <div
          id="stat-card-readiness"
          className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Exam Readiness
            </span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 mb-2">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {readiness}%
            </div>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, readiness))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Lectures done / total */}
        <div
          id="stat-card-lectures"
          className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Curriculum Lectures
            </span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              <span>{lectures.done}</span>
              <span className="text-lg font-normal text-slate-400 mx-1.5">/</span>
              <span className="text-xl font-medium text-slate-500">{lectures.total}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {lectures.total === 0 ? 'No lectures registered' : `${lectures.done} of ${lectures.total} completed`}
            </p>
          </div>
        </div>

        {/* Card 3: Problems solved / total */}
        <div
          id="stat-card-problems"
          onClick={onNavigateToProblems}
          className={`bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between transition-colors ${
            onNavigateToProblems ? 'cursor-pointer hover:border-slate-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Problems Solved
            </span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Code className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              <span>{problems.solved}</span>
              <span className="text-lg font-normal text-slate-400 mx-1.5">/</span>
              <span className="text-xl font-medium text-slate-500">{problems.total}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>{problems.total === 0 ? 'No problems registered' : `${problems.solved} solved`}</span>
              {onNavigateToProblems && (
                <span className="text-blue-600 font-medium hover:underline">View repo →</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Today's tasks done / total */}
        <div
          id="stat-card-tasks"
          onClick={onNavigateToCalendar}
          className={`bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between transition-colors ${
            onNavigateToCalendar ? 'cursor-pointer hover:border-slate-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Today's Tasks
            </span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              <span>{todayTasks.done}</span>
              <span className="text-lg font-normal text-slate-400 mx-1.5">/</span>
              <span className="text-xl font-medium text-slate-500">{todayTasks.total}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-between">
              <span>{todayTasks.total === 0 ? 'None scheduled' : `${todayTasks.done} completed today`}</span>
              {onNavigateToCalendar && (
                <span className="text-blue-600 font-medium hover:underline">View calendar →</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Today's Calendar Events Section */}
      <section
        id="today-events-section"
        className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Today's Schedule & Tasks</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              {formattedDisplayDate}
            </span>
            {onNavigateToCalendar && (
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Calendar view →
              </button>
            )}
          </div>
        </div>

        {todayEvents.length > 0 ? (
          <ul id="today-events-list" className="divide-y divide-slate-100">
            {todayEvents.map((event) => (
              <li
                key={event.id}
                id={`event-item-${event.id}`}
                className="py-3 flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    id={`toggle-event-btn-${event.id}`}
                    type="button"
                    onClick={() => handleToggleEvent(event)}
                    disabled={togglingId === event.id}
                    className="shrink-0 text-slate-400 hover:text-blue-600 focus:outline-none cursor-pointer transition-colors"
                    aria-label={`Mark "${event.title}" as ${event.completed ? 'incomplete' : 'complete'}`}
                  >
                    {event.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                    )}
                  </button>
                  <span
                    className={`text-xs sm:text-sm font-medium truncate ${
                      event.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {event.title}
                  </span>
                </div>

                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium shrink-0 ${
                    event.type === 'academic'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {event.type === 'academic' ? 'Academic' : 'Task'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div id="no-events-message" className="py-8 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-500">No events or tasks scheduled for today</p>
            <p className="text-xs text-slate-400 mt-1">
              Events added to your calendar for {formattedDisplayDate} will appear here with completion checkboxes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
