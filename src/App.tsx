import { useState, useEffect, useRef } from 'react';
import { Loader2, LayoutDashboard, BookOpen, Code, Calendar, Shield, LogOut, FileCode, User as UserIcon, ShieldCheck } from 'lucide-react';
import { User } from './types.ts';
import { SignupForm } from './components/SignupForm.tsx';
import { LoginForm } from './components/LoginForm.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { SubjectsHub } from './components/SubjectsHub.tsx';
import { SubjectDetail } from './components/SubjectDetail.tsx';
import { CodingRepository } from './components/CodingRepository.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { AdminMonitor } from './components/AdminMonitor.tsx';
import { ImportConsole } from './components/ImportConsole.tsx';
import { UserProfile } from './components/UserProfile.tsx';
import { SystemSecurityModal } from './components/SystemSecurityModal.tsx';

type AuthView = 'login' | 'signup';
type AppView = 'dashboard' | 'subjects' | 'coding' | 'calendar' | 'admin' | 'import' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AuthView>('signup');
  const [isInitializing, setIsInitializing] = useState(true);

  // In-app navigation states
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Profile menu dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } catch {
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    localStorage.setItem('auth_token', token);
    setUser(authenticatedUser);
    setActiveTab('dashboard');
    setSelectedSubjectId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setSelectedSubjectId(null);
    setActiveTab('dashboard');
    setCurrentView('login');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col overflow-x-hidden w-full ${user ? 'pb-12' : 'justify-center py-8 sm:py-16 px-4 sm:px-6 lg:px-8'}`}>
      {user ? (
        <>
          {/* Top Global Navigation Bar */}
          <nav id="app-top-nav" className="sticky top-0 z-30 bg-white border-b border-slate-200 mb-6 w-full">
            <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full">
              {/* Main Nav Header */}
              <div className="flex items-center justify-between h-14 md:h-15">
                <div className="flex items-center gap-6">
                  <div
                    onClick={() => {
                      setActiveTab('dashboard');
                      setSelectedSubjectId(null);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
                    title="Go to Dashboard"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                      L
                    </div>
                    <span className="font-semibold text-slate-900 tracking-tight text-sm sm:text-base">LMS Portal</span>
                  </div>

                  {/* Desktop Navigation Tabs */}
                  <div className="hidden md:flex items-center gap-1">
                    <button
                      id="nav-tab-dashboard"
                      type="button"
                      onClick={() => {
                        setActiveTab('dashboard');
                        setSelectedSubjectId(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'dashboard' && !selectedSubjectId
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      id="nav-tab-subjects"
                      type="button"
                      onClick={() => {
                        setActiveTab('subjects');
                        setSelectedSubjectId(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'subjects' || selectedSubjectId
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Subjects</span>
                    </button>

                    <button
                      id="nav-tab-coding"
                      type="button"
                      onClick={() => {
                        setActiveTab('coding');
                        setSelectedSubjectId(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'coding' && !selectedSubjectId
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Coding Repo</span>
                    </button>

                    <button
                      id="nav-tab-calendar"
                      type="button"
                      onClick={() => {
                        setActiveTab('calendar');
                        setSelectedSubjectId(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'calendar' && !selectedSubjectId
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Calendar</span>
                    </button>

                    <button
                      id="nav-tab-import"
                      type="button"
                      onClick={() => {
                        setActiveTab('import');
                        setSelectedSubjectId(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        activeTab === 'import' && !selectedSubjectId
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Import</span>
                    </button>

                    {/* Admin-only Navigation Tab */}
                    {user.role === 'admin' && (
                      <button
                        id="nav-tab-admin"
                        type="button"
                        onClick={() => {
                          setActiveTab('admin');
                          setSelectedSubjectId(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeTab === 'admin' && !selectedSubjectId
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span>Admin</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Security Shield Diagnostics Trigger Button */}
                <button
                  id="system-security-status-trigger-btn"
                  type="button"
                  onClick={() => setIsSecurityModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                  title="View Live System Security & Database Status"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline">System Security</span>
                </button>

                {/* Profile Navigation: Circular Avatar Button at Right Side */}
                <div className="relative shrink-0" ref={profileMenuRef}>
                  <button
                    id="nav-profile-circle-btn"
                    type="button"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full font-semibold text-xs transition-colors cursor-pointer select-none ${
                      activeTab === 'profile'
                        ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2 ring-offset-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title={`Profile: ${user.name} (${user.email})`}
                    aria-label="User Profile Navigation"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    {user.name.charAt(0).toUpperCase()}
                    {/* Active online indicator dot */}
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </button>

                  {/* Professional Floating Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div
                      id="nav-profile-dropdown-menu"
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-50"
                    >
                      {/* Interactive Profile Header Card */}
                      <button
                        id="dropdown-profile-header-card"
                        type="button"
                        onClick={() => {
                          setActiveTab('profile');
                          setSelectedSubjectId(null);
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {user.name}
                              </span>
                              <span className="text-[10px] font-medium text-blue-600 group-hover:underline shrink-0">
                                View →
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            <span className="inline-block text-[9px] font-medium uppercase tracking-wider text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded-sm mt-1">
                              {user.role === 'admin' ? 'Administrator' : 'Student'}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Navigation Links */}
                      <div className="mt-1 space-y-0.5">
                        <button
                          id="dropdown-nav-profile-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('profile');
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === 'profile'
                              ? 'bg-slate-100 text-slate-900 font-semibold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span>My Profile & Settings</span>
                          </div>
                          {activeTab === 'profile' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-800 font-medium">
                              Active
                            </span>
                          )}
                        </button>

                        <button
                          id="dropdown-nav-dashboard-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('dashboard');
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          id="dropdown-nav-security-link"
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setIsSecurityModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>System & Security Status</span>
                        </button>
                      </div>

                      <div className="my-1 border-t border-slate-100" />

                      {/* Logout Action */}
                      <button
                        id="dropdown-logout-btn"
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Navigation Tabs: Horizontal Scroll Strip for screens < md */}
              <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none -mx-4 px-4">
                <button
                  id="mobile-nav-tab-dashboard"
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedSubjectId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'dashboard' && !selectedSubjectId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  id="mobile-nav-tab-subjects"
                  type="button"
                  onClick={() => {
                    setActiveTab('subjects');
                    setSelectedSubjectId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'subjects' || selectedSubjectId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Subjects</span>
                </button>

                <button
                  id="mobile-nav-tab-coding"
                  type="button"
                  onClick={() => {
                    setActiveTab('coding');
                    setSelectedSubjectId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'coding' && !selectedSubjectId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Coding</span>
                </button>

                <button
                  id="mobile-nav-tab-calendar"
                  type="button"
                  onClick={() => {
                    setActiveTab('calendar');
                    setSelectedSubjectId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'calendar' && !selectedSubjectId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>

                <button
                  id="mobile-nav-tab-import"
                  type="button"
                  onClick={() => {
                    setActiveTab('import');
                    setSelectedSubjectId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'import' && !selectedSubjectId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>

                <button
                  id="mobile-nav-tab-profile"
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setSelectedSubjectId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    activeTab === 'profile' && !selectedSubjectId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>

                {user.role === 'admin' && (
                  <button
                    id="mobile-nav-tab-admin"
                    type="button"
                    onClick={() => {
                      setActiveTab('admin');
                      setSelectedSubjectId(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                      activeTab === 'admin' && !selectedSubjectId
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:text-slate-900 bg-slate-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                )}
              </div>
            </div>
          </nav>

          {/* Main Body View */}
          <main className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full min-w-0">
            {selectedSubjectId ? (
              <SubjectDetail
                subjectId={selectedSubjectId}
                onBack={() => setSelectedSubjectId(null)}
              />
            ) : activeTab === 'subjects' ? (
              <SubjectsHub
                onSelectSubject={(id) => setSelectedSubjectId(id)}
              />
            ) : activeTab === 'coding' ? (
              <CodingRepository />
            ) : activeTab === 'calendar' ? (
              <CalendarView />
            ) : activeTab === 'import' ? (
              <ImportConsole
                onNavigateToSubject={(id) => {
                  setActiveTab('subjects');
                  setSelectedSubjectId(id);
                }}
                onNavigateToCoding={() => {
                  setActiveTab('coding');
                  setSelectedSubjectId(null);
                }}
              />
            ) : activeTab === 'profile' ? (
              <UserProfile
                user={user}
                onUpdateUser={(updated) => {
                  setUser(updated);
                }}
                onLogout={handleLogout}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab);
                  setSelectedSubjectId(null);
                }}
              />
            ) : activeTab === 'admin' ? (
              <AdminMonitor onNavigateToDashboard={() => setActiveTab('dashboard')} />
            ) : (
              <Dashboard
                user={user}
                onLogout={handleLogout}
                onNavigateToSubjects={() => {
                  setActiveTab('subjects');
                  setSelectedSubjectId(null);
                }}
                onNavigateToProblems={() => {
                  setActiveTab('coding');
                  setSelectedSubjectId(null);
                }}
                onNavigateToCalendar={() => {
                  setActiveTab('calendar');
                  setSelectedSubjectId(null);
                }}
                onNavigateToProfile={() => {
                  setActiveTab('profile');
                  setSelectedSubjectId(null);
                }}
              />
            )}
          </main>
        </>
      ) : currentView === 'signup' ? (
        <SignupForm
          onSuccess={handleAuthSuccess}
          onNavigateToLogin={() => setCurrentView('login')}
        />
      ) : (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
      )}

      {/* Live System Security & Database Diagnostic Modal */}
      <SystemSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}

