import { ArrowLeft, Shield, Lock, FileText, CheckCircle2, Mail, Trash2 } from 'lucide-react';
import { SystemLogo } from './SystemLogo.tsx';

interface PrivacyPolicyProps {
  onBack: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToSignup?: () => void;
}

export function PrivacyPolicy({
  onBack,
  onNavigateToTerms,
  onNavigateToSignup,
}: PrivacyPolicyProps) {
  return (
    <div id="privacy-policy-page" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Clean Top Editorial Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="privacy-back-btn"
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onBack}>
              <SystemLogo size="sm" />
              <span className="font-semibold text-slate-900 text-sm tracking-tight">ProgressPath</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTerms && (
              <button
                type="button"
                onClick={onNavigateToTerms}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline px-2.5 py-1.5 cursor-pointer"
              >
                Terms of Service
              </button>
            )}
            {onNavigateToSignup && (
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Long-Form Legal Document */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <article className="prose prose-slate max-w-none text-slate-700">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-8 mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Data Protection</span>
              <span aria-hidden="true">·</span>
              <span>Student Privacy Charter</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Last Updated: September 2026 · Effective Date: September 25, 2026
            </p>
          </div>

          {/* Plain-Language Core Guarantees Banner */}
          <div className="mb-10 p-5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-sm text-emerald-950 space-y-2">
            <h2 className="text-base font-bold text-emerald-950 flex items-center gap-2 m-0">
              <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Our Privacy Commitment in Plain Language</span>
            </h2>
            <p className="leading-relaxed m-0 text-emerald-900/90 text-xs sm:text-sm">
              We built ProgressPath for learning, not for monetizing data. We collect only your name, email, 
              and learning progress records. We <strong>never sell your data</strong> to third parties, 
              we run zero third-party ads, and you can <strong>delete your account and personal data</strong> at 
              any time with a single deliberate confirmation on your Profile page.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. What Data We Collect
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              We practice data minimization and collect only the information strictly required to run your personal 
              study dashboard and track your coursework:
            </p>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  A. Full Name
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 m-0">
                  Used exclusively to personalize your learning dashboard, greet you upon login, and display your name 
                  on certificates and milestone badges. You can edit your display name anytime in Profile settings.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  B. Email Address
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 m-0">
                  Used as your unique account credential for authentication, session verification, and critical 
                  security notices. Your email is never published publicly or shared with other learners.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  C. Learning Progress Data
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 m-0">
                  Includes your lecture completion checkboxes, coding repository solutions, problem notes, bookmarks, 
                  custom subjects you author, and academic calendar tasks. This data is stored strictly to compute 
                  your exam readiness score and maintain your study milestones across devices.
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 italic">
              What we do NOT collect: We do not collect credit cards, billing addresses, biometric data, precise GPS location, 
              or cross-app advertising identifiers.
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Zero Data Selling — We Do NOT Sell Your Data
            </h2>
            <p className="leading-relaxed text-sm sm:text-base font-medium text-slate-800">
              We make a clear and unequivocal promise: ProgressPath does not sell, rent, trade, share, or monetize 
              your personal information, study history, or learning progress data with any third party, marketing broker, 
              or advertising firm.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-slate-600">
              There are no third-party tracking pixels, ad SDKs, or targeted ad networks running on ProgressPath. 
              Your coursework and problem solving habits remain private to you.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. How We Use Your Data
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              The data we collect is utilized strictly for the following functional purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-slate-700 pl-2">
              <li>Authenticating your account and keeping your session active securely.</li>
              <li>Calculating your Exam Readiness Percentage and tracking completed lectures and coding challenges.</li>
              <li>Syncing your study checklist, custom curricula, and scheduled calendar tasks in real-time.</li>
              <li>Detecting and mitigating unauthorized brute-force attempts through automated rate limiters.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. How to Delete Your Account &amp; Personal Data (Step 16)
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              We strongly support your right to be forgotten. You do not need to submit tickets or wait for support 
              approval to purge your information. You can permanently delete your entire account directly from within the app:
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-rose-50/70 border-2 border-rose-200 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Self-Service Account Deletion via the Profile Page</span>
              </div>
              <p className="text-rose-900/90 leading-relaxed">
                As implemented in the Profile Page (Step 16), follow these steps to permanently purge your data:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-800 pl-1">
                <li>Log in and open your <strong>Profile</strong> (from the desktop top navigation tab or top-right avatar menu).</li>
                <li>Scroll to the bottom to the <strong>Danger Zone: Delete Account</strong> section.</li>
                <li>In the confirmation input, type your exact email address or <span className="font-mono font-bold text-rose-700">DELETE</span> to confirm intent.</li>
                <li>Click <strong>&ldquo;Permanently Delete Account&rdquo;</strong>.</li>
              </ol>
              <div className="pt-2 border-t border-rose-200/80 text-xs text-rose-900 space-y-1">
                <p>
                  <strong>What gets removed:</strong> Your personal credentials, user ID, custom authored subjects, personal lectures, problem bookmarks/notes, calendar events, and progress checkmarks are permanently and irreversibly purged from our database.
                </p>
                <p>
                  <strong>What stays:</strong> Global platform curriculum shared with other learners is preserved so other students&rsquo; study paths are not interrupted.
                </p>
              </div>
            </div>

            <p className="leading-relaxed text-xs sm:text-sm text-slate-600 pt-2">
              If you cannot access your account or prefer manual deletion, you can also email us directly at{' '}
              <a href="mailto:luckypc08292@gmail.com" className="text-blue-600 font-semibold underline">
                luckypc08292@gmail.com
              </a>{' '}
              and we will process your deletion request within 48 hours.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. Data Security &amp; Encryption Standards
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              We employ industry-standard technical measures to safeguard your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-slate-700 pl-2">
              <li><strong>Password Hashing:</strong> Passwords are never stored in plaintext. They are irreversibly hashed using modern salted bcrypt encryption.</li>
              <li><strong>Secure Transport:</strong> All communication between your browser and our servers is encrypted using modern TLS (HTTPS).</li>
              <li><strong>Rate Limiting:</strong> Authentication endpoints are guarded with sliding-window rate limiters to prevent brute-force credential stuffing.</li>
              <li><strong>Database Protection:</strong> Database queries utilize strict schema validation and sanitization to prevent injection vulnerabilities.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              6. Cookies &amp; Local Storage
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              ProgressPath uses browser Local Storage solely to maintain your active authentication session (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">auth_token</code>). 
              We do not use advertising cookies, third-party analytics trackers, or fingerprinting scripts.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              7. Contact Email for Privacy Inquiries
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, 
              please contact our administrative team directly:
            </p>
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Privacy Officer &amp; Support Contact</p>
                <a
                  href="mailto:luckypc08292@gmail.com"
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  luckypc08292@gmail.com
                </a>
              </div>
            </div>
          </section>

          {/* Document Footer Navigation */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to previous screen</span>
            </button>

            {onNavigateToTerms && (
              <button
                type="button"
                onClick={onNavigateToTerms}
                className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Read Terms of Service →
              </button>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
