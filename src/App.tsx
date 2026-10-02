import { useState, useEffect, useRef } from 'react';
import { Loader2, LayoutDashboard, BookOpen, Code, Calendar, Shield, LogOut, FileCode, User as UserIcon, ShieldCheck, Home, UploadCloud, Settings } from 'lucide-react';
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
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { SystemLogo } from './components/SystemLogo.tsx';
import { TermsOfService } from './components/TermsOfService.tsx';
import { PrivacyPolicy } from './components/PrivacyPolicy.tsx';

type AuthView = 'landing' | 'login' | 'signup' | 'terms' | 'privacy';
type AppView = 'dashboard' | 'subjects' | 'coding' | 'calendar' | 'admin' | 'import' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AuthView>('landing');
  const [previousAuthView, setPreviousAuthView] = useState<AuthView>('landing');
  const [activeLegalDoc, setActiveLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // In-app navigation states
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Short day & date (e.g. mon, Sep 28) for navigation display
  const today = new Date();
  const shortDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const shortDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTodayShort = `${shortDay}, ${shortDate}`;

  // Profile menu dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
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
    setCurrentView('landing');
  };

  const navigateToTerms = (from: AuthView = currentView) => {
    if (user) {
      setActiveLegalDoc('terms');
    } else {
      setPreviousAuthView(from);
      setCurrentView('terms');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPrivacy = (from: AuthView = currentView) => {
    if (user) {
      setActiveLegalDoc('privacy');
    } else {
      setPreviousAuthView(from);
      setCurrentView('privacy');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Legal documentation views for authenticated users
  if (activeLegalDoc === 'terms') {
    return (
      <TermsOfService
        onBack={() => {
          setActiveLegalDoc(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToPrivacy={() => setActiveLegalDoc('privacy')}
      />
    );
  }

  if (activeLegalDoc === 'privacy') {
    return (
      <PrivacyPolicy
        onBack={() => {
          setActiveLegalDoc(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToTerms={() => setActiveLegalDoc('terms')}
      />
    );
  }

  const isAuthFormView = !user && (currentView === 'login' || currentView === 'signup');

  return (
    <div
      className={`min-h-screen bg-slate-50 flex flex-col overflow-x-hidden w-full ${
        user
          ? 'pb-12'
          : isAuthFormView
          ? 'justify-center py-8 sm:py-16 px-4 sm:px-6 lg:px-8'
          : ''
      }`}
    >
      {user ? (
        <>
          {/* Top Global Navigation Bar */}
          <nav id="app-top-nav" className="sticky top-0 z-30 bg-white border-b border-slate-200 mb-6 w-full shadow-xs">
            <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
              {/* Main Nav Header */}
              <div className="flex items-center justify-between h-14 md:h-15">
                {/* Left: Brand Logo */}
                <div
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedSubjectId(null);
                  }}
                  className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
                  title="Go to Dashboard"
                >
                  <SystemLogo size="sm" />
                  <span className="font-semibold text-slate-900 tracking-tight text-sm sm:text-base">ProgressPath</span>
                </div>

                {/* Center: Desktop Navigation Tabs (Centered on desktop) */}
                <div className="hidden md:flex items-center justify-center gap-1 flex-1 mx-4">
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

                {/* Profile Navigation: Circular Avatar Button at Right Side */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  {/* Small Day, Date Badge near Profile Circle */}
                  <button
                    type="button"
                    id="nav-date-indicator-btn"
                    onClick={() => {
                      setActiveTab('calendar');
                      setSelectedSubjectId(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
                    title="Today's date (Click to open Calendar)"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="capitalize">{formattedTodayShort}</span>
                  </button>

                  <div className="relative shrink-0" ref={profileMenuRef}>
                  {activeTab === 'profile' && !selectedSubjectId ? (
                    <button
                      id="nav-profile-circle-btn"
                      type="button"
                      onClick={() => setIsProfileSettingsOpen(true)}
                      className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-semibold text-xs transition-all cursor-pointer select-none bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs active:scale-95"
                      title="Settings & Services"
                      aria-label="Settings and Services"
                    >
                      <Settings className="w-4 h-4 text-slate-700" />
                    </button>
                  ) : (
                    <button
                      id="nav-profile-circle-btn"
                      type="button"
                      onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                      className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full font-semibold text-xs transition-colors cursor-pointer select-none bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      title={`Profile: ${user.name} (${user.email})`}
                      aria-label="User Profile Navigation"
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="true"
                    >
                      {user.name.charAt(0).toUpperCase()}
                      {/* Active online indicator dot */}
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </button>
                  )}

                  {/* Professional Floating Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div
                      id="nav-profile-dropdown-menu"
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 text-slate-800"
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
                        className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-blue-600 font-semibold group-hover:underline shrink-0">
                                View →
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200/60'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200/60'
                              }`}>
                                {user.role === 'admin' ? (
                                  <>
                                    <Shield className="w-2.5 h-2.5" />
                                    <span>Administrator</span>
                                  </>
                                ) : (
                                  <span>Student</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Navigation Links Group */}
                      <div className="mt-2 space-y-1">
                        {/* Admin Access Tab */}
                        <button
                          id="dropdown-nav-admin-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('admin');
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            activeTab === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60 shadow-2xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              <Shield className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-semibold leading-tight">Admin Access</span>
                              <span className="block text-[10px] text-slate-400">Controls & monitoring</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            Access
                          </span>
                        </button>

                        {/* Profile & Settings Tab */}
                        <button
                          id="dropdown-nav-profile-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('profile');
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            activeTab === 'profile'
                              ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              activeTab === 'profile' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <UserIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-semibold leading-tight">My Profile</span>
                              <span className="block text-[10px] text-slate-400">Settings & activity</span>
                            </div>
                          </div>
                          {activeTab === 'profile' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold">
                              Active
                            </span>
                          )}
                        </button>

                        {/* Import YouTube Playlist Tab */}
                        <button
                          id="dropdown-nav-import-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('import');
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            activeTab === 'import'
                              ? 'bg-red-50 text-red-700 font-semibold border border-red-200/60 shadow-2xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              activeTab === 'import' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
                            }`}>
                              <UploadCloud className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-semibold leading-tight">Import Playlist</span>
                              <span className="block text-[10px] text-slate-400">YouTube auto-extract</span>
                            </div>
                          </div>
                          {activeTab === 'import' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-semibold">
                              Active
                            </span>
                          )}
                        </button>

                        {/* Dashboard Tab */}
                        <button
                          id="dropdown-nav-dashboard-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('dashboard');
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            activeTab === 'dashboard'
                              ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <LayoutDashboard className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-semibold leading-tight">Dashboard</span>
                              <span className="block text-[10px] text-slate-400">Overview & schedule</span>
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="my-1.5 border-t border-slate-100" />

                      {/* Logout Action */}
                      <button
                        id="dropdown-logout-btn"
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <span className="block text-xs font-semibold leading-tight">Sign out</span>
                          <span className="block text-[10px] text-rose-400">Log out of your session</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </nav>

          {/* Main Body View */}
          <main className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 min-w-0 flex-1 pb-24 md:pb-12 overflow-x-hidden">
            <div
              key={selectedSubjectId ? `subject-${selectedSubjectId}` : activeTab}
              className="tab-slide-enter w-full min-w-0"
            >
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
                <CalendarView onBack={() => setActiveTab('dashboard')} />
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
                  onNavigateToTerms={() => navigateToTerms('landing')}
                  onNavigateToPrivacy={() => navigateToPrivacy('landing')}
                  isSettingsOpen={isProfileSettingsOpen}
                  onOpenSettings={() => setIsProfileSettingsOpen(true)}
                  onCloseSettings={() => setIsProfileSettingsOpen(false)}
                />
              ) : activeTab === 'admin' ? (
                <AdminMonitor
                  currentUser={user}
                  onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
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
            </div>
          </main>

          {/* Mobile App Bottom Navigation Bar: Home, Subjects, Import, Coding, Calendar, Profile */}
          <nav
            id="mobile-bottom-app-nav"
            aria-label="Mobile Bottom Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-lg"
          >
            {/* 1. Home */}
            <button
              type="button"
              id="mobile-bottom-nav-home"
              onClick={() => {
                setActiveTab('dashboard');
                setSelectedSubjectId(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard' && !selectedSubjectId
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </button>

            {/* 2. Subjects */}
            <button
              type="button"
              id="mobile-bottom-nav-subjects"
              onClick={() => {
                setActiveTab('subjects');
                setSelectedSubjectId(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'subjects' || selectedSubjectId
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span>Subjects</span>
            </button>

            {/* 3. Coding */}
            <button
              type="button"
              id="mobile-bottom-nav-coding"
              onClick={() => {
                setActiveTab('coding');
                setSelectedSubjectId(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'coding' && !selectedSubjectId
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Code className="w-5 h-5 mb-0.5" />
              <span>Coding</span>
            </button>

            {/* 5. Calendar */}
            <button
              type="button"
              id="mobile-bottom-nav-calendar"
              onClick={() => {
                setActiveTab('calendar');
                setSelectedSubjectId(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'calendar' && !selectedSubjectId
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span>Calendar</span>
            </button>

            {/* 6. Profile Circle */}
            <button
              type="button"
              id="mobile-bottom-nav-profile"
              onClick={() => {
                setActiveTab('profile');
                setSelectedSubjectId(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                activeTab === 'profile' && !selectedSubjectId
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 select-none ${
                  activeTab === 'profile' && !selectedSubjectId
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>Profile</span>
            </button>
          </nav>
        </>
      ) : currentView === 'landing' ? (
        <LandingPage
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToSignup={() => setCurrentView('signup')}
          onNavigateToTerms={() => navigateToTerms('landing')}
          onNavigateToPrivacy={() => navigateToPrivacy('landing')}
        />
      ) : currentView === 'signup' ? (
        <SignupForm
          onSuccess={handleAuthSuccess}
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToHome={() => setCurrentView('landing')}
          onNavigateToTerms={() => navigateToTerms('signup')}
          onNavigateToPrivacy={() => navigateToPrivacy('signup')}
        />
      ) : currentView === 'terms' ? (
        <TermsOfService
          onBack={() => {
            setCurrentView(previousAuthView || 'landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToPrivacy={() => navigateToPrivacy(previousAuthView)}
          onNavigateToSignup={() => {
            setCurrentView('signup');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : currentView === 'privacy' ? (
        <PrivacyPolicy
          onBack={() => {
            setCurrentView(previousAuthView || 'landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateToTerms={() => navigateToTerms(previousAuthView)}
          onNavigateToSignup={() => {
            setCurrentView('signup');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onNavigateToSignup={() => setCurrentView('signup')}
          onNavigateToHome={() => setCurrentView('landing')}
        />
      )}

      {/* Live System Security & Database Diagnostic Modal */}
      <SystemSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Mandatory First-Login Password Change Modal for newly created Admins */}
      {user && user.mustChangePassword && (
        <ForcePasswordChangeModal
          user={user}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

