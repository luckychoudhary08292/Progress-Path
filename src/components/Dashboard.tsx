import { useState, useEffect } from 'react';
import { LogOut, CheckCircle2, Circle, Calendar, BookOpen, Code, Award, Loader2, Sparkles, User as UserIcon, Plus, X } from 'lucide-react';
import { User, DashboardStats, TodayEvent } from '../types.ts';
import { apiCache } from '../services/apiCache.ts';

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
  // Format today's date for display and API query using local date
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const formattedDisplayDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const shortDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const shortDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mobileShortDisplayDate = `${shortDay}, ${shortDate}`;

  const cachedStats = apiCache.get<DashboardStats>(`dashboard_${dateStr}`);
  const [stats, setStats] = useState<DashboardStats | null>(cachedStats || null);
  const [isLoading, setIsLoading] = useState(!cachedStats);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<'task' | 'academic'>('task');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

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
        apiCache.set(`dashboard_${dateStr}`, data);
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

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError('Please enter a task title');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setTaskError('');
    setIsSubmittingTask(true);

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: dateStr,
          title: taskTitle.trim(),
          type: taskType,
        }),
      });

      if (res.ok) {
        const created: any = await res.json();
        const createdEvent: TodayEvent = {
          id: created.id,
          title: created.title,
          date: created.date,
          type: created.type,
          completed: created.completed ?? false,
        };

        setStats((prev) => {
          if (!prev) return prev;
          const exists = prev.todayEvents.some((e) => e.id === createdEvent.id);
          const updatedEvents = exists ? prev.todayEvents : [createdEvent, ...prev.todayEvents];
          return {
            ...prev,
            todayTasks: {
              ...prev.todayTasks,
              total: prev.todayTasks.total + 1,
            },
            todayEvents: updatedEvents,
          };
        });

        setTaskTitle('');
        setIsAddTaskModalOpen(false);
        fetchDashboardData();
      } else {
        const err = await res.json();
        setTaskError(err.message || 'Failed to add task');
      }
    } catch {
      setTaskError('Network error while saving task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
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
    <div id="dashboard-container" className="w-full space-y-2 sm:space-y-6">
      {/* Desktop & Tablet: Full Welcome Back Card */}
      <header
        id="dashboard-desktop-welcome-bar"
        className="hidden sm:flex bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex-row items-center justify-between gap-4"
      >
        <div>
          <h1 id="dashboard-welcome-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Academic progress overview and today's schedule
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800"
        >
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg text-slate-700 shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                Get started by creating your first subject
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                Add curriculum topics, lectures, and coding practice to begin tracking your exam readiness.
              </p>
            </div>
          </div>

          {onNavigateToSubjects && (
            <button
              type="button"
              onClick={onNavigateToSubjects}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Go to Subjects</span>
            </button>
          )}
        </div>
      )}

      {/* Four Stat Cards - Compact 2x2 on Mobile */}
      <section aria-label="Progress Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Readiness % */}
        <div
          id="stat-card-readiness"
          className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
              Exam Readiness
            </span>
            <span className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4 mb-1 sm:mb-2">
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
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
          className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
              Lectures
            </span>
            <span className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              <span>{lectures.done}</span>
              <span className="text-base font-normal text-slate-400 mx-1">/</span>
              <span className="text-base sm:text-xl font-medium text-slate-500">{lectures.total}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">
              {lectures.total === 0 ? 'No lectures' : `${lectures.done} of ${lectures.total} done`}
            </p>
          </div>
        </div>

        {/* Card 3: Problems solved / total */}
        <div
          id="stat-card-problems"
          onClick={onNavigateToProblems}
          className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between transition-colors shadow-xs ${
            onNavigateToProblems ? 'cursor-pointer hover:border-slate-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
              Coding
            </span>
            <span className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              <span>{problems.solved}</span>
              <span className="text-base font-normal text-slate-400 mx-1">/</span>
              <span className="text-base sm:text-xl font-medium text-slate-500">{problems.total}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 flex items-center justify-between truncate">
              <span>{problems.total === 0 ? 'None' : `${problems.solved} solved`}</span>
              {onNavigateToProblems && (
                <span className="text-blue-600 font-medium hover:underline hidden sm:inline">View →</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Today's tasks done / total */}
        <div
          id="stat-card-tasks"
          onClick={onNavigateToCalendar}
          className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-5 flex flex-col justify-between transition-colors shadow-xs ${
            onNavigateToCalendar ? 'cursor-pointer hover:border-slate-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">
              Today's Tasks
            </span>
            <span className="p-1 sm:p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-2 sm:mt-4">
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              <span>{todayTasks.done}</span>
              <span className="text-base font-normal text-slate-400 mx-1">/</span>
              <span className="text-base sm:text-xl font-medium text-slate-500">{todayTasks.total}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 flex items-center justify-between truncate">
              <span>{todayTasks.total === 0 ? 'None' : `${todayTasks.done} completed`}</span>
              {onNavigateToCalendar && (
                <span className="text-blue-600 font-medium hover:underline hidden sm:inline">View →</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Today's Calendar Events Section */}
      <section
        id="today-events-section"
        className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-2.5 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Today's Schedule & Tasks</h2>
          </div>
          {/* Mobile + Add Task Button */}
          <button
            id="mobile-add-task-btn"
            type="button"
            onClick={() => {
              setTaskError('');
              setIsAddTaskModalOpen(true);
            }}
            className="sm:hidden inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs transition-all focus:outline-none"
            aria-label="Add task"
            title="Add task for today"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
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
            <button
              type="button"
              onClick={() => {
                setTaskError('');
                setIsAddTaskModalOpen(true);
              }}
              className="sm:hidden mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all border border-blue-200"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Task for Today</span>
            </button>
          </div>
        )}

        {/* Mobile Task Adding Popup Screen */}
        {isAddTaskModalOpen && (
          <div
            id="mobile-add-task-popup"
            className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs p-0 transition-opacity"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-modal-heading"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddTaskModalOpen(false);
            }}
          >
            <div
              className="w-full bg-white rounded-t-2xl p-5 shadow-2xl border-t border-slate-100 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 id="add-task-modal-heading" className="text-sm font-bold text-slate-900 leading-tight">
                      Add Today's Task
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Scheduled for {mobileShortDisplayDate}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="close-add-task-modal-btn"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAddTask} className="space-y-3.5">
                <div>
                  <label htmlFor="mobile-task-title-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Task Title
                  </label>
                  <input
                    id="mobile-task-title-input"
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g., Complete Arrays module, Review Notes"
                    autoFocus
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 text-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskType('task')}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        taskType === 'task'
                          ? 'bg-blue-50 text-blue-700 border-blue-400 font-semibold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      General Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskType('academic')}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        taskType === 'academic'
                          ? 'bg-blue-50 text-blue-700 border-blue-400 font-semibold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Academic / Study
                    </button>
                  </div>
                </div>

                {taskError && (
                  <p className="text-xs text-rose-600 font-medium">{taskError}</p>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTaskModalOpen(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 active:scale-98 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-quick-add-task-btn"
                    type="submit"
                    disabled={isSubmittingTask || !taskTitle.trim()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingTask ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add Task</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
