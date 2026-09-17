import { useState, useEffect, useMemo, FormEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  BookOpen,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { CalendarEvent, EventType } from '../types.ts';
import { ConfirmModal } from './ConfirmModal.tsx';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CalendarView() {
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  // Current displayed calendar month/year
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  // Selected date string in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Events data
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [datesWithEvents, setDatesWithEvents] = useState<string[]>([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);

  // New event form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Toggling or deleting tracking
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // Helper to construct "YYYY-MM"
  const currentMonthKey = useMemo(() => {
    const m = String(currentMonth + 1).padStart(2, '0');
    return `${currentYear}-${m}`;
  }, [currentYear, currentMonth]);

  // Fetch events for current month
  const fetchMonthEvents = async (monthKey: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setIsLoadingMonth(true);
      const res = await fetch(`/api/calendar?month=${monthKey}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMonthEvents(data.events || []);
        setDatesWithEvents(data.datesWithEvents || []);
      }
    } catch (err) {
      console.error('Failed to load month events', err);
    } finally {
      setIsLoadingMonth(false);
    }
  };

  useEffect(() => {
    fetchMonthEvents(currentMonthKey);
  }, [currentMonthKey]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const curY = now.getFullYear();
    const curM = now.getMonth();
    setCurrentYear(curY);
    setCurrentMonth(curM);
    setSelectedDate(todayStr);
  };

  // Generate calendar cells (leading, days of month, trailing)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const mStr = String(prevM + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      cells.push({
        dateStr: `${prevY}-${mStr}-${dStr}`,
        dayNum,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({
        dateStr: `${currentYear}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Trailing days from next month to complete the row of 7
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      for (let d = 1; d <= remaining; d++) {
        const mStr = String(nextM + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        cells.push({
          dateStr: `${nextY}-${mStr}-${dStr}`,
          dayNum: d,
          isCurrentMonth: false,
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Selected date events from state (instant, no extra round-trip required)
  const selectedDateEvents = useMemo(() => {
    return monthEvents.filter((e) => e.date === selectedDate);
  }, [monthEvents, selectedDate]);

  // Date formatted display title for side panel
  const formattedSelectedDateDisplay = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Handle Add Event
  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter an event title');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          title: newTitle.trim(),
          type: newType,
        }),
      });

      if (res.ok) {
        const createdEvent: CalendarEvent = await res.json();
        // Immediately add to monthEvents without needing to re-select date
        setMonthEvents((prev) => [...prev, createdEvent]);
        setDatesWithEvents((prev) => (prev.includes(selectedDate) ? prev : [...prev, selectedDate]));
        setNewTitle('');
      } else {
        const err = await res.json();
        setFormError(err.message || 'Failed to add event');
      }
    } catch {
      setFormError('Network error while saving event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Event status
  const handleToggleEvent = async (event: CalendarEvent) => {
    const token = localStorage.getItem('auth_token');
    if (!token || actionInProgressId) return;

    const newCompleted = !event.completed;

    // Optimistic UI update
    setMonthEvents((prev) =>
      prev.map((item) => (item.id === event.id ? { ...item, completed: newCompleted } : item))
    );

    setActionInProgressId(event.id);
    try {
      const res = await fetch(`/api/calendar/events/${event.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Revert on error
        setMonthEvents((prev) =>
          prev.map((item) => (item.id === event.id ? { ...item, completed: event.completed } : item))
        );
      }
    } catch {
      setMonthEvents((prev) =>
        prev.map((item) => (item.id === event.id ? { ...item, completed: event.completed } : item))
      );
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Delete Event with Confirmation Prompt
  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const eventId = eventToDelete.id;
    const eventDate = eventToDelete.date;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Optimistic UI remove
    const previousEvents = [...monthEvents];
    const updatedEvents = monthEvents.filter((item) => item.id !== eventId);
    setMonthEvents(updatedEvents);

    // Update datesWithEvents if no more events for that date
    const remainingOnDate = updatedEvents.some((e) => e.date === eventDate);
    if (!remainingOnDate) {
      setDatesWithEvents((prev) => prev.filter((d) => d !== eventDate));
    }

    setActionInProgressId(eventId);
    setEventToDelete(null);

    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Revert on error
        setMonthEvents(previousEvents);
        setDatesWithEvents((prev) => (prev.includes(eventDate) ? prev : [...prev, eventDate]));
      }
    } catch {
      setMonthEvents(previousEvents);
      setDatesWithEvents((prev) => (prev.includes(eventDate) ? prev : [...prev, eventDate]));
    } finally {
      setActionInProgressId(null);
    }
  };

  const isSelectedDateToday = selectedDate === todayStr;

  return (
    <div id="calendar-page-container" className="w-full space-y-6">
      {/* Header & Month Navigator */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 id="calendar-main-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Academic & Task Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Schedule academic milestones, study sessions, and daily tasks.
            </p>
          </div>
        </div>

        {/* Month Switching Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="calendar-jump-today-btn"
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              id="calendar-prev-month-btn"
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              id="calendar-current-month-label"
              className="px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-slate-800 select-none min-w-[120px] text-center"
            >
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              id="calendar-next-month-btn"
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid + Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Month Grid */}
        <section
          id="calendar-grid-card"
          className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl border border-slate-200 p-4 sm:p-5"
        >
          {/* Calendar Header Row: Days of Week */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
            {DAYS_OF_WEEK.map((dayName, idx) => (
              <div
                key={dayName}
                id={`calendar-weekday-${idx}`}
                className="text-center text-[11px] font-medium text-slate-400 uppercase tracking-wider py-1 select-none"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          {isLoadingMonth ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">Loading calendar days...</p>
            </div>
          ) : (
            <div id="calendar-days-grid" className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === todayStr;
                const hasEvents = datesWithEvents.includes(cell.dateStr);

                let cellClasses =
                  'relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer aspect-square min-h-[40px] sm:min-h-[52px] select-none ';

                if (isSelected && isToday) {
                  cellClasses += 'bg-slate-900 text-white font-semibold ring-2 ring-blue-500';
                } else if (isSelected) {
                  cellClasses += 'bg-slate-900 text-white font-semibold';
                } else if (isToday) {
                  cellClasses += 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 hover:bg-blue-100/70';
                } else if (!cell.isCurrentMonth) {
                  cellClasses += 'text-slate-300 hover:text-slate-600 hover:bg-slate-50';
                } else {
                  cellClasses += 'text-slate-700 hover:bg-slate-100 hover:text-slate-900';
                }

                return (
                  <button
                    key={cell.dateStr}
                    id={`calendar-cell-${cell.dateStr}`}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      const [cYear, cMonth] = cell.dateStr.split('-').map(Number);
                      if (cMonth - 1 !== currentMonth || cYear !== currentYear) {
                        setCurrentYear(cYear);
                        setCurrentMonth(cMonth - 1);
                      }
                    }}
                    className={cellClasses}
                    title={cell.dateStr}
                  >
                    {/* Day number */}
                    <span className="text-xs sm:text-sm">{cell.dayNum}</span>

                    {/* Indicators area */}
                    <div className="flex items-center gap-1 mt-auto">
                      {isToday && (
                        <span
                          className={`hidden sm:inline-block text-[9px] font-semibold px-1 rounded ${
                            isSelected && isToday
                              ? 'bg-slate-800 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          Today
                        </span>
                      )}

                      {/* Dot indicator for dates with at least one event */}
                      {hasEvents && (
                        <span
                          id={`calendar-dot-${cell.dateStr}`}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected
                              ? 'bg-amber-300'
                              : isToday
                              ? 'bg-blue-600'
                              : 'bg-slate-400'
                          }`}
                          title="Has events scheduled"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Legend at bottom of grid */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-300 inline-block" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-900 inline-block" />
              <span>Selected Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span>Has Events</span>
            </div>
          </div>
        </section>

        {/* Right Column: Selected Date Task & Event Panel */}
        <section
          id="calendar-side-panel"
          className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4"
        >
          {/* Side panel date title */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="calendar-selected-date-title" className="text-sm sm:text-base font-bold text-slate-900">
                  {formattedSelectedDateDisplay}
                </h2>
                {isSelectedDateToday && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDateEvents.length} item{selectedDateEvents.length === 1 ? '' : 's'}{' '}
                {selectedDateEvents.length > 0 &&
                  `(${selectedDateEvents.filter((e) => e.completed).length} completed)`}
              </p>
            </div>
          </div>

          {/* Add Event Form */}
          <form id="calendar-add-event-form" onSubmit={handleAddEvent} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="calendar-event-title-input" className="text-xs font-medium text-slate-600">
                Add Event or Task
              </label>
              <input
                id="calendar-event-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Solve 3 Tree Problems or Midterm Exam..."
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Type selector: Academic vs Task */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-0.5">
                <button
                  id="calendar-type-task-btn"
                  type="button"
                  onClick={() => setNewType('task')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    newType === 'task'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Task</span>
                </button>
                <button
                  id="calendar-type-academic-btn"
                  type="button"
                  onClick={() => setNewType('academic')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    newType === 'academic'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Academic</span>
                </button>
              </div>

              <button
                id="calendar-add-event-submit-btn"
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Add Event</span>
              </button>
            </div>

            {formError && (
              <p id="calendar-form-error" className="text-xs text-rose-600 font-medium">
                {formError}
              </p>
            )}
          </form>

          {/* List of events for selected date */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-600">
              Scheduled Items
            </h3>

            {selectedDateEvents.length === 0 ? (
              <div
                id="calendar-no-events-placeholder"
                className="py-7 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 px-4"
              >
                <p className="text-xs font-medium text-slate-600">No events for this date</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Use the input above to schedule a task or academic deadline.
                </p>
              </div>
            ) : (
              <div id="calendar-events-list" className="space-y-2">
                {selectedDateEvents.map((evt) => {
                  const isBusy = actionInProgressId === evt.id;

                  return (
                    <div
                      key={evt.id}
                      id={`calendar-event-item-${evt.id}`}
                      className={`group p-2.5 sm:p-3 rounded-lg border transition-colors flex items-start justify-between gap-2.5 ${
                        evt.completed
                          ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleEvent(evt)}
                          disabled={isBusy}
                          className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                          title={evt.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {evt.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium break-words leading-relaxed ${
                              evt.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {evt.title}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                                evt.type === 'academic'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-100'
                              }`}
                            >
                              {evt.type}
                            </span>
                            {evt.completed && (
                              <span className="text-[10px] text-emerald-600 font-medium">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setEventToDelete(evt)}
                        disabled={isBusy}
                        className="opacity-50 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                        title="Delete event"
                        aria-label={`Delete event "${evt.title}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Modal: Delete Event */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        title="Delete Event"
        message={
          eventToDelete
            ? `Delete this event? This can't be undone. "${eventToDelete.title}" scheduled for ${eventToDelete.date} will be permanently removed.`
            : ''
        }
        confirmLabel="Delete Event"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
}
