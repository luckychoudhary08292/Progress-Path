import bcrypt from 'bcryptjs';
import { UserRepository } from './models/User.ts';
import { AuditLogRepository } from './models/AuditLog.ts';

/**
 * Ensures the system has a properly provisioned administrator account.
 * Security hardening:
 * - In production, only uses explicitly configured ADMIN_EMAIL & ADMIN_PASSWORD env vars.
 *   Never seeds default hardcoded backdoor credentials ('admin@lms.local' / 'Admin@Secure2026!') in production.
 * - In non-production (local/dev preview), falls back to a local dev admin when no admin exists yet.
 */
export async function bootstrapInitialAdmin(): Promise<void> {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const allUsers = await UserRepository.listAllUsers();
    const existingAdmin = allUsers.find((u) => u.role === 'admin');

    const envEmail = (process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
    const envName = (process.env.ADMIN_NAME || 'Super Administrator').trim();
    const envPassword = process.env.ADMIN_PASSWORD || '';

    // 1. If explicit ADMIN_EMAIL is configured, ensure it exists or is promoted
    if (envEmail) {
      const targetUser = await UserRepository.findByEmail(envEmail);
      if (targetUser) {
        if (targetUser.role !== 'admin') {
          await UserRepository.updateRole(targetUser.id, 'admin');
          await AuditLogRepository.log({
            actorId: 'system_bootstrap',
            actorName: 'System Bootstrap',
            actorEmail: 'system@lms.internal',
            action: 'bootstrap_initial_admin',
            targetUserId: targetUser.id,
            targetEmail: targetUser.email,
            details: `Promoted designated ADMIN_EMAIL (${targetUser.email}) to administrator via system bootstrap.`,
          });
          console.log(`[Bootstrap] Promoted configured ADMIN_EMAIL "${targetUser.email}" to administrator.`);
        }
        return;
      }

      if (envPassword && envPassword.length >= 8) {
        const hashedPassword = await bcrypt.hash(envPassword, 10);
        const newAdmin = await UserRepository.create({
          name: envName,
          email: envEmail,
          password: hashedPassword,
          role: 'admin',
          mustChangePassword: false,
        });

        await AuditLogRepository.log({
          actorId: 'system_bootstrap',
          actorName: 'System Bootstrap',
          actorEmail: 'system@lms.internal',
          action: 'bootstrap_initial_admin',
          targetUserId: newAdmin.id,
          targetEmail: newAdmin.email,
          details: `Created initial primary administrator account (${newAdmin.email}) via secure environment bootstrap.`,
        });
        console.log(`[Bootstrap] Initial administrator account created: "${newAdmin.email}".`);
        return;
      }

      if (!existingAdmin && isProduction) {
        console.warn(
          '[Bootstrap Security Notice] ADMIN_EMAIL is set but ADMIN_PASSWORD (< 8 chars or empty) is missing; admin cannot be auto-created until user registers with ADMIN_EMAIL or ADMIN_PASSWORD (>= 8 chars) is provided.'
        );
      }
      return;
    }

    // 2. If an admin already exists in DB, nothing further needed
    if (existingAdmin) {
      return;
    }

    // 3. In production without ADMIN_EMAIL/ADMIN_PASSWORD, refuse to create insecure default passwords
    if (isProduction) {
      console.warn(
        '[Bootstrap Security Notice] No admin account exists in production. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) environment variables to provision the initial administrator securely.'
      );
      return;
    }

    // 4. Local development preview only: seed local dev admin
    const devEmail = 'admin@lms.local';
    const devPass = 'Admin@Secure2026!';
    const existingLocal = await UserRepository.findByEmail(devEmail);
    if (!existingLocal) {
      const hashedLocalPass = await bcrypt.hash(devPass, 10);
      const created = await UserRepository.create({
        name: 'Development Administrator',
        email: devEmail,
        password: hashedLocalPass,
        role: 'admin',
        mustChangePassword: false,
      });
      await AuditLogRepository.log({
        actorId: 'system_bootstrap',
        actorName: 'System Bootstrap',
        actorEmail: 'system@lms.internal',
        action: 'bootstrap_initial_admin',
        targetUserId: created.id,
        targetEmail: created.email,
        details: `Created local development administrator (${created.email}) for non-production environment.`,
      });
      console.log(`[Bootstrap] Development administrator provisioned: ${devEmail}`);
    } else if (existingLocal.role !== 'admin') {
      await UserRepository.updateRole(existingLocal.id, 'admin');
    }
  } catch (err) {
    console.error('[Bootstrap Error] Failed to complete initial admin bootstrap:', err);
  }
}
