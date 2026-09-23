import React, { useState } from 'react';
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { User, FieldErrors } from '../types.ts';
import { AuthFeatureShowcase } from './AuthFeatureShowcase.tsx';
import { SystemLogo } from './SystemLogo.tsx';

interface LoginFormProps {
  onSuccess: (user: User, token: string) => void;
  onNavigateToSignup: () => void;
  onNavigateToHome?: () => void;
}

export function LoginForm({ onSuccess, onNavigateToSignup, onNavigateToHome }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
        } else {
          setErrors({ email: data.message || 'Login failed. Please check your credentials.' });
        }
        return;
      }

      onSuccess(data.user, data.token);
    } catch {
      setErrors({ email: 'Network error. Please verify your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto">
      {onNavigateToHome && (
        <div className="mb-4">
          <button
            id="login-back-to-home-btn"
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to overview</span>
          </button>
        </div>
      )}

      {/* Split-screen Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Login Form */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <div className="md:hidden flex items-center gap-2.5 mb-3">
                <SystemLogo size="sm" />
                <span className="font-bold text-slate-900 text-sm">ProgressPath</span>
              </div>
              <h1 id="login-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Sign in to continue your learning milestones and coding challenges
              </p>
            </div>

            <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-slate-400'
                  }`}
                />
                {errors.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-slate-400'
                    }`}
                  />
                  <button
                    id="toggle-login-password-visibility"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Link to Signup */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New here?{' '}
              <button
                id="navigate-to-signup-btn"
                type="button"
                onClick={onNavigateToSignup}
                className="font-semibold text-slate-900 hover:underline cursor-pointer ml-1"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Right Side: Feature Showcase (hidden on mobile) */}
        <AuthFeatureShowcase />
      </div>
    </div>
  );
}
