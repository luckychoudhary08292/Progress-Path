import React, { useState } from 'react';
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import { User, FieldErrors } from '../types.ts';
import { AuthFeatureShowcase } from './AuthFeatureShowcase.tsx';

interface SignupFormProps {
  onSuccess: (user: User, token: string) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome?: () => void;
}

export function SignupForm({ onSuccess, onNavigateToLogin, onNavigateToHome }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const hasEightChars = password.length >= 8;

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
        } else {
          setErrors({ email: data.message || 'Signup failed. Please try again.' });
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
            id="signup-back-to-home-btn"
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
        {/* Left Side: Signup Form */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <div className="md:hidden flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center font-bold text-xs text-white">
                  P
                </div>
                <span className="font-bold text-slate-900 text-sm">Progress Path</span>
              </div>
              <h1 id="signup-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Create your account
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Start tracking lecture roadmaps and engineering practice problems
              </p>
            </div>

            <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Rivera"
                  value={name}
                  disabled={isLoading}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                    errors.name
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-slate-400'
                  }`}
                />
                {errors.name && (
                  <p
                    id="name-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Email Address Field */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:ring-slate-400'
                  }`}
                />
                {errors.email && (
                  <p
                    id="email-error"
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
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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
                    aria-describedby="password-requirements"
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-slate-400'
                    }`}
                  />
                  <button
                    id="toggle-signup-password-visibility"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Upfront Password Requirements */}
                <div id="password-requirements" className="mt-2 flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors shrink-0 ${
                      hasEightChars
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {hasEightChars ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                  </div>
                  <span
                    className={`transition-colors ${
                      hasEightChars ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    At least 8 characters
                  </span>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    disabled={isLoading}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }
                    }}
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                      errors.confirmPassword
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-200 focus:ring-slate-400'
                    }`}
                  />
                  <button
                    id="toggle-signup-confirm-password-visibility"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    id="confirm-password-error"
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating your account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Link to Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                id="navigate-to-login-btn"
                type="button"
                onClick={onNavigateToLogin}
                className="font-semibold text-slate-900 hover:underline cursor-pointer ml-1"
              >
                Log in
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
