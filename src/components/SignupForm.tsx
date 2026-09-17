import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { User, FieldErrors } from '../types.ts';

interface SignupFormProps {
  onSuccess: (user: User, token: string) => void;
  onNavigateToLogin: () => void;
}

export function SignupForm({ onSuccess, onNavigateToLogin }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
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
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7">
        <div className="mb-6 text-center">
          <h1 id="signup-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            Create Account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your details below to get started
          </p>
        </div>

        <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
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

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
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
              htmlFor="password"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              disabled={isLoading}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 bg-white transition-colors focus:outline-hidden focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
                errors.password
                  ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-slate-400'
              }`}
            />
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

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              id="navigate-to-login-btn"
              type="button"
              onClick={onNavigateToLogin}
              className="font-medium text-slate-900 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
