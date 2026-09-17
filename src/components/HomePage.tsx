import { LogOut } from 'lucide-react';
import { User } from '../types.ts';

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center">
        <div className="space-y-4">
          <h1
            id="welcome-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
          >
            Welcome, {user.name}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            You are successfully logged in as <span className="font-semibold text-slate-800">{user.email}</span>.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center">
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl text-base transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
