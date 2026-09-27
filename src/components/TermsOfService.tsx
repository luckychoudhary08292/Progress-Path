import { ArrowLeft, Shield, FileText, ExternalLink, CheckCircle2, Mail, Trash2 } from 'lucide-react';
import { SystemLogo } from './SystemLogo.tsx';

interface TermsOfServiceProps {
  onBack: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToSignup?: () => void;
}

export function TermsOfService({
  onBack,
  onNavigateToPrivacy,
  onNavigateToSignup,
}: TermsOfServiceProps) {
  return (
    <div id="terms-of-service-page" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Clean Top Editorial Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="terms-back-btn"
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
            {onNavigateToPrivacy && (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline px-2.5 py-1.5 cursor-pointer"
              >
                Privacy Policy
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
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Legal Documentation</span>
              <span aria-hidden="true">·</span>
              <span>Plain-Language Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
              Terms of Service
            </h1>
            <p className="text-sm text-slate-500">
              Last Updated: September 2026 · Effective Date: September 25, 2026
            </p>
          </div>

          {/* Plain Language Summary Box */}
          <div className="mb-10 p-5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-sm text-blue-950 space-y-2">
            <h2 className="text-base font-bold text-blue-950 flex items-center gap-2 m-0">
              <Shield className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Plain-Language Summary</span>
            </h2>
            <p className="leading-relaxed m-0 text-blue-900/90 text-xs sm:text-sm">
              ProgressPath is an academic study tracking and algorithmic coding practice platform. 
              We do not sell your personal data. You retain full ownership of your notes and learning data, 
              and you can permanently delete your account and personal records at any time directly from 
              your Profile page.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              By creating an account, checking the &ldquo;I agree to the Terms of Service and Privacy Policy&rdquo; 
              box during signup, or continuing to use ProgressPath, you acknowledge that you have read, understood, 
              and agreed to be bound by these Terms of Service. If you do not agree to these terms, please do not 
              create an account or use the application.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Educational Purpose &amp; Services Provided
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              ProgressPath provides structured educational tools to assist students and software engineers with 
              tracking syllabus completion, practicing algorithmic coding problems, organizing lecture notes, 
              and scheduling academic milestones.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-slate-700 pl-2">
              <li><strong>Subject &amp; Lecture Tracking:</strong> Track video lectures, study materials, and session progress.</li>
              <li><strong>Algorithmic Coding Repository:</strong> Practice curated programming problems categorized by topic and difficulty.</li>
              <li><strong>Academic Calendar:</strong> Schedule revision deadlines, exams, and daily milestones.</li>
              <li><strong>Curriculum Import:</strong> Import external roadmaps in JSON or markdown format for personal study.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. User Accounts &amp; Security
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              To use ProgressPath, you must create an account with a display name, a valid email address, and a secure password.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-slate-700 pl-2">
              <li><strong>Account Confidentiality:</strong> You are responsible for safeguarding your login credentials. Do not share your password with others.</li>
              <li><strong>Accurate Information:</strong> You agree to provide a valid email address for authentication, session verification, and account recovery.</li>
              <li><strong>Notification of Breach:</strong> If you suspect unauthorized access to your account, please change your password immediately in your Profile or contact us.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. Data Collection, Privacy &amp; Zero Sale of Data
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              Your privacy is paramount. As detailed in our Privacy Policy:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base text-slate-700 pl-2">
              <li><strong>Data Collected:</strong> We collect only what is strictly necessary to provide the service: your full name, email address, and personal learning progress data (lecture ticks, coding solutions, notes, and calendar tasks).</li>
              <li><strong>Zero Sale of Data:</strong> We will never sell, rent, monetize, or lease your personal information or learning records to any third party, broker, or advertising network.</li>
              <li><strong>No Advertising Trackers:</strong> We do not display third-party advertisements or track your web activity outside of ProgressPath.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. Account Deletion &amp; Data Purging (Step 16 Feature)
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              You retain full control over your data. We provide an immediate, self-service account deletion mechanism:
            </p>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>How to Delete Your Account at Any Time:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                <li>Navigate to the <strong>Profile</strong> page via the top navigation or top-right user menu.</li>
                <li>Scroll down to the <strong>Danger Zone: Delete Account</strong> section (clearly marked in a red box).</li>
                <li>Type your email address or <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-700">DELETE</code> to confirm deliberate intent.</li>
                <li>Click <strong>&ldquo;Permanently Delete Account&rdquo;</strong>.</li>
              </ol>
              <p className="text-slate-600 pt-1 text-xs">
                Upon confirmation, your personal subjects, custom lectures, problem notes, calendar tasks, and completion progress 
                are permanently purged. Platform-wide shared curricula remain intact for other students.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              6. Acceptable Use Policy
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              When using ProgressPath, you agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-slate-700 pl-2">
              <li>Attempt to compromise, reverse-engineer, or breach system security or rate limiters.</li>
              <li>Inject malicious scripts, SQL/NoSQL injection payloads, or exploit vulnerabilities.</li>
              <li>Use automated scrapers or bots to overload platform infrastructure.</li>
              <li>Impersonate other students, educators, or platform administrators.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              7. Third-Party Links &amp; Public Curricula
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              Curricula in ProgressPath may contain links to external learning materials, such as YouTube lectures, 
              LeetCode problems, Codeforces challenges, or documentation sites. ProgressPath does not own or control 
              these external third-party services and is not responsible for their availability or content.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              8. Limitation of Liability
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              ProgressPath is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis for educational tracking. 
              While we maintain high availability and robust data backups, we do not guarantee uninterrupted service 
              or warrant that the platform is entirely error-free.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3 mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">
              9. Contact Information &amp; Questions
            </h2>
            <p className="leading-relaxed text-sm sm:text-base">
              If you have any questions about these Terms of Service or need assistance with your account, please reach out to us:
            </p>
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Administrator &amp; Support Contact</p>
                <a
                  href="mailto:luckypc08292@gmail.com"
                  className="text-sm font-semibold text-blue-600 hover:underline"
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

            {onNavigateToPrivacy && (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Read Privacy Policy →
              </button>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
