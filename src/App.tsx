import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, LayoutDashboard, BookOpen, Code, Calendar, Shield, LogOut, 
  FileCode, User as UserIcon, Users, ShieldCheck, Home, UploadCloud, Settings, 
  MessageSquare, ChevronDown, Check, GraduationCap, Layers, Clock, ArrowRight
} from 'lucide-react';
import { User, AdminSection } from './types.ts';
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
import { useDesktopNativeInstallPrompt } from './hooks/useDesktopNativeInstallPrompt.ts';
import { ThemeToggle } from './components/ThemeToggle.tsx';

type AuthView = 'landing' | 'login' | 'signup' | 'terms' | 'privacy';
type AppView = 'dashboard' | 'subjects' | 'coding' | 'calendar' | 'admin' | 'import' | 'profile';

export default function App() {
  // Triggers native browser install pop up dialog on desktop (not mobile, no custom HTML popup)
  useDesktopNativeInstallPrompt();

  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AuthView>('landing');
  const [previousAuthView, setPreviousAuthView] = useState<AuthView>('landing');
  const [activeLegalDoc, setActiveLegalDoc] = useState<'terms' | 'privacy' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // In-app navigation states
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'security' | 'danger' | 'permissions' | 'extractor' | 'feedback' | null>(null);

  // Admin Section state & Interface Mode Switcher
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('overview');
  const [isInterfaceDropdownOpen, setIsInterfaceDropdownOpen] = useState(false);
  const interfaceDropdownRef = useRef<HTMLDivElement>(null);

  // Computed interface mode
  const isAdminMode = user?.role === 'admin' && activeTab === 'admin';

  // Short day & date (e.g. mon, Sep 28) for navigation display
  const today = new Date();
  const shortDay = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const shortDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTodayShort = `${shortDay}, ${shortDate}`;

  // Profile menu dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close interface switcher dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (interfaceDropdownRef.current && !interfaceDropdownRef.current.contains(event.target as Node)) {
        setIsInterfaceDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsInterfaceDropdownOpen(false);
      }
    }
    if (isInterfaceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInterfaceDropdownOpen]);

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
        } else if (res.status === 401) {
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } catch (err) {
        console.warn('Network issue checking auth status:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, []);

  // ---------------------------------------------------------------------------
  // System Back Button (Mobile & Desktop) Navigation History Management
  // ---------------------------------------------------------------------------
  // Whenever the active view, tab, or subject changes, push an entry to browser history.
  // When the user taps the device back button or browser back arrow, popstate restores
  // the previous screen instead of exiting the entire application.
  const isNavigatingFromPopState = useRef(false);

  // Synchronize browser history stack when state changes internally
  useEffect(() => {
    if (isInitializing) return;
    if (isNavigatingFromPopState.current) {
      isNavigatingFromPopState.current = false;
      return;
    }

    const statePayload = {
      isAuth: !!user,
      currentView,
      activeLegalDoc,
      activeTab,
      selectedSubjectId,
      activeAdminSection,
    };

    // Replace state if on root initial, or push state for new in-app navigations
    const currentState = window.history.state;
    const isSameState =
      currentState &&
      currentState.isAuth === statePayload.isAuth &&
      currentState.currentView === statePayload.currentView &&
      currentState.activeLegalDoc === statePayload.activeLegalDoc &&
      currentState.activeTab === statePayload.activeTab &&
      currentState.selectedSubjectId === statePayload.selectedSubjectId &&
      currentState.activeAdminSection === statePayload.activeAdminSection;

    if (!isSameState) {
      window.history.pushState(statePayload, '', window.location.pathname);
    }
  }, [user, currentView, activeLegalDoc, activeTab, selectedSubjectId, activeAdminSection, isInitializing]);

  // Handle hardware / system back button (popstate event)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      isNavigatingFromPopState.current = true;

      if (state) {
        if (state.activeLegalDoc !== undefined) {
          setActiveLegalDoc(state.activeLegalDoc);
        }
        if (state.currentView) {
          setCurrentView(state.currentView);
        }
        if (state.selectedSubjectId !== undefined) {
          setSelectedSubjectId(state.selectedSubjectId);
        }
        if (state.activeTab) {
          setActiveTab(state.activeTab);
        }
        if (state.activeAdminSection) {
          setActiveAdminSection(state.activeAdminSection);
        }
      } else {
        // Fallback natural step backward if state was empty
        if (activeLegalDoc) {
          setActiveLegalDoc(null);
        } else if (selectedSubjectId) {
          setSelectedSubjectId(null);
        } else if (activeTab === 'admin') {
          setActiveTab('dashboard');
        } else if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        } else if (!user && currentView !== 'landing') {
          setCurrentView('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeLegalDoc, selectedSubjectId, activeTab, user, currentView]);

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
      <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-between p-8 select-none transition-colors duration-200">
        <div className="w-full flex-1 flex flex-col items-center justify-center max-w-sm text-center space-y-7">
          {/* Animated Branded SVG Logo with Ambient Glow & Float */}
          <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95">
            {/* Ambient Pulsing Aura */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-teal-400/20 blur-xl animate-pulse" />
            
            {/* Logo Emblem Card with Floating Animation */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/15 flex items-center justify-center animate-float">
              <img
                src="/system_logo.svg"
                alt="ProgressPath"
                className="w-full h-full object-contain pointer-events-none drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Platform Title & Tagline */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ProgressPath
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              Study &amp; Coding Tracker
            </p>
          </div>

          {/* Sleek Progress Track with Shimmer Beam */}
          <div className="w-48 sm:w-56 space-y-2 pt-2">
            <div className="relative w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full animate-shimmer" />
            </div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 tracking-wide">
              Loading your workspace...
            </p>
          </div>
        </div>

        {/* Footer Brand Note */}
        <div className="text-[10px] font-medium text-slate-400 dark:text-zinc-600 tracking-wider uppercase">
          Empowering Engineering Mastery
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
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-x-clip w-full transition-colors duration-150 ${
        user
          ? 'pb-12'
          : isAuthFormView
          ? 'justify-center py-8 sm:py-16 px-4 sm:px-6 lg:px-8'
          : ''
      }`}
    >
      {user ? (
        <>
          {/* Top Global Navigation Bar - Dynamic Admin / User Interface Navbar */}
          <nav
            id="app-top-nav"
            className={`fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-150 ${
              isAdminMode
                ? 'bg-white/95 dark:bg-black/95 border-purple-200/80 dark:border-purple-900/60 shadow-xs'
                : 'bg-white/95 dark:bg-black/95 border-slate-200 dark:border-zinc-800 shadow-xs'
            }`}
          >
            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-transparent text-slate-900 dark:text-white transition-colors">
              {/* Main Nav Header */}
              <div className="flex items-center justify-between h-14 md:h-15 gap-2 sm:gap-4">
                {/* Left: Brand Logo + Interface Switcher Dropdown */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div
                    onClick={() => {
                      if (isAdminMode) {
                        setActiveAdminSection('overview');
                      } else {
                        setActiveTab('dashboard');
                        setSelectedSubjectId(null);
                      }
                    }}
                    className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0"
                    title={isAdminMode ? "Admin Control Panel (Overview)" : "Go to Dashboard"}
                  >
                    <SystemLogo size="sm" />
                    <span className="font-semibold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">ProgressPath</span>
                  </div>

                  {/* Interface Switcher Dropdown (Desktop only - hidden on mobile) */}
                  {user.role === 'admin' && (
                    <div className="hidden md:block relative shrink-0" ref={interfaceDropdownRef}>
                      <button
                        id="interface-switcher-btn"
                        type="button"
                        onClick={() => setIsInterfaceDropdownOpen((prev) => !prev)}
                        className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shadow-2xs cursor-pointer select-none active:scale-95 ${
                          isAdminMode
                            ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/70'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                        }`}
                        title="Switch between Admin and User interfaces"
                        aria-haspopup="true"
                        aria-expanded={isInterfaceDropdownOpen}
                      >
                        {isAdminMode ? (
                          <>
                            <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span className="hidden xs:inline">Admin Panel</span>
                            <span className="xs:hidden">Admin</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="hidden xs:inline">User Interface</span>
                            <span className="xs:hidden">User</span>
                          </>
                        )}
                        <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-zinc-400 transition-transform duration-200 ${isInterfaceDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {isInterfaceDropdownOpen && (
                        <div
                          id="interface-switcher-menu"
                          className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            Select Interface
                          </div>

                          {/* Option 1: User Interface */}
                          <button
                            id="switch-to-user-view-option"
                            type="button"
                            onClick={() => {
                              setActiveTab('dashboard');
                              setSelectedSubjectId(null);
                              setIsInterfaceDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              !isAdminMode
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  !isAdminMode
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                                }`}
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-slate-900 dark:text-white">User Interface</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Study, coding &amp; tracker</div>
                              </div>
                            </div>
                            {!isAdminMode && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
                            )}
                          </button>

                          {/* Option 2: Admin Panel */}
                          <button
                            id="switch-to-admin-panel-option"
                            type="button"
                            onClick={() => {
                              setActiveTab('admin');
                              setSelectedSubjectId(null);
                              setIsInterfaceDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 mt-1 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isAdminMode
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                                : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isAdminMode
                                    ? 'bg-purple-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-slate-900 dark:text-white">Admin Panel</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">Users, content &amp; logs</div>
                              </div>
                            </div>
                            {isAdminMode && (
                              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 ml-1.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Center: Desktop Navigation Tabs (ADMIN vs USER) */}
                {isAdminMode ? (
                  /* Admin Panel Navigation Tabs */
                  <div className="hidden md:flex items-center justify-center gap-1 flex-1 mx-2 lg:mx-4">
                    <button
                      id="admin-nav-tab-overview"
                      type="button"
                      onClick={() => setActiveAdminSection('overview')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeAdminSection === 'overview'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/80 dark:border-purple-800 shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Overview</span>
                    </button>

                    <button
                      id="admin-nav-tab-users"
                      type="button"
                      onClick={() => setActiveAdminSection('users')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeAdminSection === 'users'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/80 dark:border-purple-800 shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Users</span>
                    </button>

                    <button
                      id="admin-nav-tab-content"
                      type="button"
                      onClick={() => setActiveAdminSection('content')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeAdminSection === 'content'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/80 dark:border-purple-800 shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Content</span>
                    </button>

                    <button
                      id="admin-nav-tab-import"
                      type="button"
                      onClick={() => setActiveAdminSection('import')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeAdminSection === 'import'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/80 dark:border-purple-800 shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Global Importer</span>
                    </button>

                    <button
                      id="admin-nav-tab-activity"
                      type="button"
                      onClick={() => setActiveAdminSection('activity')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeAdminSection === 'activity'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/80 dark:border-purple-800 shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Activity Log</span>
                    </button>

                    <button
                      id="admin-nav-tab-feedback"
                      type="button"
                      onClick={() => setActiveAdminSection('feedback')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeAdminSection === 'feedback'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/80 dark:border-purple-800 shadow-2xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Feedback</span>
                    </button>
                  </div>
                ) : (
                  /* Standard User Navigation Tabs */
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
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Calendar</span>
                    </button>
                  </div>
                )}

                {/* Profile Navigation: Circular Avatar Button at Right Side */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  {/* Quick Exit to User View button when in Admin Mode */}
                  {isAdminMode && (
                    <button
                      id="nav-quick-exit-to-user-btn"
                      type="button"
                      onClick={() => {
                        setActiveTab('dashboard');
                        setSelectedSubjectId(null);
                      }}
                      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs"
                      title="Exit Admin Panel & Return to User View"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>User View</span>
                    </button>
                  )}

                  {/* Small Day, Date Badge near Profile Circle */}
                  <button
                    type="button"
                    id="nav-date-indicator-btn"
                    onClick={() => {
                      if (!isAdminMode) {
                        setActiveTab('calendar');
                        setSelectedSubjectId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                    title="Today's date"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="capitalize">{formattedTodayShort}</span>
                  </button>

                  <div className="relative shrink-0" ref={profileMenuRef}>
                  {activeTab === 'profile' && !selectedSubjectId ? (
                    <button
                      id="nav-profile-circle-btn"
                      type="button"
                      onClick={() => setIsProfileSettingsOpen(true)}
                      className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-semibold text-xs transition-all cursor-pointer select-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 hover:scale-105"
                      title="Settings & Services"
                      aria-label="Settings and Services"
                    >
                      <Settings className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </button>
                  ) : (
                    <button
                      id="nav-profile-circle-btn"
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                          setActiveTab('profile');
                          setSelectedSubjectId(null);
                          setIsProfileMenuOpen(false);
                        } else {
                          setIsProfileMenuOpen((prev) => !prev);
                        }
                      }}
                      className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full font-semibold text-xs transition-colors cursor-pointer select-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95"
                      title={`Profile: ${user.name} (${user.email})`}
                      aria-label="User Profile Navigation"
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="true"
                    >
                      {user.name.charAt(0).toUpperCase()}
                      {/* Active online indicator dot */}
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </button>
                  )}

                  {/* Professional Floating Profile Dropdown (Mobile-only, hidden on desktop) */}
                  {isProfileMenuOpen && (
                    <div
                      id="nav-profile-dropdown-menu"
                      className="md:hidden absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 text-slate-800 dark:text-slate-100"
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
                        className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {user.name}
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline shrink-0">
                                View &rarr;
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800'
                                  : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800'
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
                        {/* Admin / User Interface Switch Action - Strictly for admins */}
                        {user.role === 'admin' && (
                          isAdminMode ? (
                            /* In Admin Mode: Show "User Access" to switch back to User Interface */
                            <button
                              id="dropdown-nav-user-access-link"
                              type="button"
                              onClick={() => {
                                setActiveTab('dashboard');
                                setSelectedSubjectId(null);
                                setIsProfileMenuOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/80 group"
                              title="Switch to User Interface"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-600 text-white shadow-2xs">
                                  <GraduationCap className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left">
                                  <span className="block text-xs font-semibold leading-tight text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-white transition-colors">
                                    User Access
                                  </span>
                                  <span className="block text-[10px] text-blue-600/80 dark:text-blue-400">
                                    Switch to User Workspace
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200/60 dark:border-blue-700">
                                Switch &rarr;
                              </span>
                            </button>
                          ) : (
                            /* In User Mode: Show "Admin Access" to switch to Admin Panel */
                            <button
                              id="dropdown-nav-admin-link"
                              type="button"
                              onClick={() => {
                                setActiveTab('admin');
                                setSelectedSubjectId(null);
                                setIsProfileMenuOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200/80 dark:border-purple-800/80 group"
                              title="Switch to Admin Panel"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-purple-600 text-white shadow-2xs">
                                  <Shield className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left">
                                  <span className="block text-xs font-semibold leading-tight text-purple-900 dark:text-purple-200 group-hover:text-purple-700 dark:group-hover:text-white transition-colors">
                                    Admin Access
                                  </span>
                                  <span className="block text-[10px] text-purple-600/80 dark:text-purple-400">
                                    Switch to Admin Panel
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200/60 dark:border-purple-700">
                                Access &rarr;
                              </span>
                            </button>
                          )
                        )}

                        {/* Profile & Settings Tab */}
                        <button
                          id="dropdown-nav-profile-link"
                          type="button"
                          onClick={() => {
                            setActiveTab('profile');
                            setActiveProfileTab(null);
                            setSelectedSubjectId(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            activeTab === 'profile'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              activeTab === 'profile' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              <UserIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-semibold leading-tight">My Profile</span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500">Settings &amp; activity</span>
                            </div>
                          </div>
                          {activeTab === 'profile' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
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
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold border border-red-200/60 dark:border-red-900/60 shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              activeTab === 'import' ? 'bg-red-600 text-white' : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                            }`}>
                              <UploadCloud className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-semibold leading-tight">YouTube Playlist Importer</span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500">youtube playlist importer</span>
                            </div>
                          </div>
                          {activeTab === 'import' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold">
                              Active
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Settings Button (Opens Settings & Theme Modal) */}
                      <button
                        id="dropdown-nav-settings-link"
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('profile');
                          setIsProfileSettingsOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <span className="block text-xs font-semibold leading-tight">Settings</span>
                            <span className="block text-[10px] text-slate-400">Theme mode, security & preferences</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Open &rarr;</span>
                      </button>

                      <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                      {/* Logout Action */}
                      <button
                        id="dropdown-logout-btn"
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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

          {/* Spacer to prevent layout shift beneath fixed nav */}
          <div className="h-14 md:h-15 w-full shrink-0 mb-2.5 sm:mb-5 md:mb-6" aria-hidden="true" />

          {/* Main Body View */}
          <main className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 min-w-0 flex-1 pb-24 md:pb-12 overflow-x-clip">
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
                  activeProfileTab={activeProfileTab}
                  onProfileTabChange={setActiveProfileTab}
                />
              ) : activeTab === 'admin' && user.role === 'admin' ? (
                <AdminMonitor
                  currentUser={user}
                  activeSection={activeAdminSection}
                  onSectionChange={setActiveAdminSection}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setSelectedSubjectId(null);
                  }}
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

          {/* Mobile App Bottom Navigation Bar: Dedicated Admin vs User layout */}
          {isAdminMode ? (
            <nav
              id="mobile-bottom-admin-nav"
              aria-label="Mobile Admin Navigation"
              className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-purple-200/80 dark:border-purple-900/60 px-1 py-1 flex items-center justify-around shadow-lg transition-colors"
            >
              <button
                type="button"
                id="mobile-admin-bottom-overview"
                onClick={() => setActiveAdminSection('overview')}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  activeAdminSection === 'overview'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                id="mobile-admin-bottom-users"
                onClick={() => setActiveAdminSection('users')}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  activeAdminSection === 'users'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span>Users</span>
              </button>

              <button
                type="button"
                id="mobile-admin-bottom-content"
                onClick={() => setActiveAdminSection('content')}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  activeAdminSection === 'content'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 mb-0.5" />
                <span>Content</span>
              </button>

              <button
                type="button"
                id="mobile-admin-bottom-import"
                onClick={() => setActiveAdminSection('import')}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  activeAdminSection === 'import'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4 mb-0.5" />
                <span>Import</span>
              </button>

              <button
                type="button"
                id="mobile-admin-bottom-activity"
                onClick={() => setActiveAdminSection('activity')}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  activeAdminSection === 'activity'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 mb-0.5" />
                <span>Activity</span>
              </button>

              {/* Exit to User View quick button */}
              <button
                type="button"
                id="mobile-admin-bottom-exit-user"
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedSubjectId(null);
                }}
                className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                title="Return to User View"
              >
                <GraduationCap className="w-4 h-4 mb-0.5" />
                <span>User View</span>
              </button>
            </nav>
          ) : (
            <nav
              id="mobile-bottom-app-nav"
              aria-label="Mobile Bottom Navigation"
              className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 px-1 py-1.5 flex items-center justify-around shadow-lg transition-colors"
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
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
          )}
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

