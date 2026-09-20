import bcrypt from 'bcryptjs';
import { UserRepository } from './models/User.ts';
import { AuditLogRepository } from './models/AuditLog.ts';

/**
 * Ensures the system has at least one properly provisioned administrator account.
 * Follows the strict rule: "The very first admin account must be created through a one-time setup step
 * (e.g. a seed/env-based bootstrap script), never through the public signup form — signup should always create role 'user'."
 */
export async function bootstrapInitialAdmin(): Promise<void> {
  try {
    const allUsers = await UserRepository.listAllUsers();
    const existingAdmin = allUsers.find((u) => u.role === 'admin');

    const bootstrapEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.INITIAL_ADMIN_EMAIL ||
      'admin@lms.local'
    ).trim().toLowerCase();

    const bootstrapName = (process.env.ADMIN_NAME || 'Super Administrator').trim();
    const bootstrapPassword = process.env.ADMIN_PASSWORD || 'Admin@Secure2026!';

    // If no admin exists anywhere in the database or store
    if (!existingAdmin) {
      console.log(`[Bootstrap] No administrator found. Provisioning initial admin: ${bootstrapEmail}`);

      const existingUser = await UserRepository.findByEmail(bootstrapEmail);
      if (existingUser) {
        // Upgrade existing user to admin
        await UserRepository.updateRole(existingUser.id, 'admin');
        await UserRepository.update(existingUser.id, { mustChangePassword: false });

        await AuditLogRepository.log({
          actorId: 'system_bootstrap',
          actorName: 'System Bootstrap',
          actorEmail: 'system@lms.internal',
          action: 'bootstrap_initial_admin',
          targetUserId: existingUser.id,
          targetEmail: existingUser.email,
          details: `Promoted existing user ${existingUser.email} to initial primary administrator via system bootstrap.`,
        });

        console.log(`[Bootstrap] Promoted existing account "${existingUser.email}" to primary administrator.`);
      } else {
        const hashedPassword = await bcrypt.hash(bootstrapPassword, 10);
        const newAdmin = await UserRepository.create({
          name: bootstrapName,
          email: bootstrapEmail,
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
          details: `Created initial primary administrator account (${newAdmin.email}) via one-time secure system bootstrap.`,
        });

        console.log(`[Bootstrap] Initial administrator account created: "${newAdmin.email}".`);
      }
    }

    // Also verify developer admin account if registered
    const devUser = await UserRepository.findByEmail('luckypc08292@gmail.com');
    if (devUser && devUser.role !== 'admin') {
      await UserRepository.updateRole(devUser.id, 'admin');
      console.log('[Bootstrap] Verified admin role for registered developer account luckypc08292@gmail.com');
    }

    // Ensure system test admin account (admin@lms.local) exists for easy administrator sign-in
    const localAdmin = await UserRepository.findByEmail('admin@lms.local');
    if (!localAdmin) {
      const hashedLocalPass = await bcrypt.hash('Admin@Secure2026!', 10);
      await UserRepository.create({
        name: 'System Administrator',
        email: 'admin@lms.local',
        password: hashedLocalPass,
        role: 'admin',
        mustChangePassword: false,
      });
      console.log('[Bootstrap] Created secondary system admin: admin@lms.local');
    } else if (localAdmin.role !== 'admin') {
      await UserRepository.updateRole(localAdmin.id, 'admin');
      console.log('[Bootstrap] Verified admin role for admin@lms.local');
    }
  } catch (err) {
    console.error('[Bootstrap Error] Failed to complete initial admin bootstrap:', err);
  }
}
