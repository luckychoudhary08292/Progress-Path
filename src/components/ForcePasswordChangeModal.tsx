import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from '../types.ts';

interface ForcePasswordChangeModalProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onLogout: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  user,
  onSuccess,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors: Record<string, string> = {};
    if (!currentPassword) {
      errors.currentPassword = 'Temporary password is required';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'New password cannot be identical to the temporary password';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/change-first-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setGeneralError(data.message || 'Failed to update password');
        }
        return;
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      onSuccess(data.user);
    } catch {
      setGeneralError('Network error updating password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="force-password-change-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-password-change-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="force-password-change-title" className="text-base font-bold tracking-tight">
                Change Temporary Password
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                Initial login requirement for {user.name}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 text-xs text-amber-900 flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">Security Policy Enforcement</p>
              <p className="text-amber-800 leading-relaxed">
                An administrator provisioned your account with a temporary password. You must establish your own confidential password before accessing the system.
              </p>
            </div>
          </div>

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Current Temporary Password */}
            <div>
              <label
                htmlFor="input-temp-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Temporary Password Provided by Admin
              </label>
              <div className="relative">
                <input
                  id="input-temp-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className={`w-full px-3.5 py-2 pr-10 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors ${
                    fieldErrors.currentPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                  aria-label={showPasswords ? 'Hide password' : 'Show password'}
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {fieldErrors.currentPassword && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="input-new-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                New Personal Password
              </label>
              <input
                id="input-new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={`w-full px-3.5 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors ${
                  fieldErrors.newPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              />
              {fieldErrors.newPassword && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.newPassword}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="input-confirm-new-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="input-confirm-new-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className={`w-full px-3.5 py-2 text-xs bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors ${
                  fieldErrors.confirmPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-col gap-2">
              <button
                id="btn-submit-first-password"
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Set Password & Enter Portal</span>
                  </>
                )}
              </button>

              <button
                id="btn-logout-from-force-modal"
                type="button"
                onClick={onLogout}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Return Later</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
