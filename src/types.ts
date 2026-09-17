export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'student';
  createdAt?: string;
}

export interface UserProfileStats {
  subjectsCount: number;
  userSubjectsCreated: number;
  totalLectures: number;
  lecturesCompleted: number;
  totalProblems: number;
  problemsSolved: number;
  eventsCount: number;
  overallReadinessPercent: number;
}

export interface UserProfileResponse {
  user: User;
  stats: UserProfileStats;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  [key: string]: string | undefined;
}

export interface TodayEvent {
  id: string;
  title: string;
  date: string;
  type: 'academic' | 'task';
  completed: boolean;
}

export interface DashboardStats {
  readinessPercent: number;
  lectures: {
    done: number;
    total: number;
  };
  problems: {
    solved: number;
    total: number;
  };
  todayTasks: {
    done: number;
    total: number;
  };
  todayEvents: TodayEvent[];
  hasZeroData: boolean;
}

export interface SubjectSummary {
  id: string;
  name: string;
  isGlobal: boolean;
  isOwner: boolean;
  nextSessionNumber: number;
  totalTopics: number;
  completedTopics: number;
  percent: number;
}

export interface LectureItem {
  id: string;
  subjectId: string;
  session: number;
  title: string;
  videoUrl?: string;
  isOwner: boolean;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface SubjectDetail {
  subject: {
    id: string;
    name: string;
    isGlobal: boolean;
    isOwner: boolean;
    nextSessionNumber: number;
  };
  lectures: LectureItem[];
  totalTopics: number;
  completedTopics: number;
}

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ProblemStatus = 'todo' | 'in_progress' | 'completed' | 'revision';

export interface ProblemItem {
  id: string;
  name: string;
  difficulty: ProblemDifficulty;
  category: string;
  link?: string;
  isGlobal: boolean;
  isOwner: boolean;
  status: ProblemStatus;
  createdAt: string;
}

export type EventType = 'academic' | 'task';

export interface CalendarEvent {
  id: string;
  userId: string;
  date: string;
  title: string;
  type: EventType;
  completed: boolean;
  createdAt: string;
}

export interface AdminUserComparison {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  lecturesDone: number;
  totalLectures: number;
  lecturesCompletedPercent: number;
  problemsSolved: number;
  totalProblems: number;
  problemsSolvedPercent: number;
  overallReadinessPercent: number;
  createdAt: string;
}

export type AdminSortColumn =
  | 'name'
  | 'email'
  | 'lecturesCompletedPercent'
  | 'problemsSolvedPercent'
  | 'overallReadinessPercent';

export type SortDirection = 'asc' | 'desc';

