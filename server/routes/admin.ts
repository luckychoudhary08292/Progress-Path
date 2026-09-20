import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, authenticateAdmin } from './auth.ts';
import { UserRepository, UserRole } from '../models/User.ts';
import { AuditLogRepository } from '../models/AuditLog.ts';
import {
  SubjectRepository,
  LectureRepository,
  ProblemRepository,
  ProgressRepository,
} from '../repositories.ts';

const router = Router();

// Airtight route protection: enforce token authentication AND admin role for all admin routes
router.use(authenticateToken, authenticateAdmin);

// ======================================================================
// 1. OVERVIEW DASHBOARD ROUTE (Default Tab)
// ======================================================================
router.get('/overview', authenticateToken, authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const allUsers = await UserRepository.listAllUsers();
    const globalSubjects = await SubjectRepository.listGlobal();
    const globalLectures = await LectureRepository.listGlobal();
    const globalProblems = await ProblemRepository.listGlobal();
    const totalProgressCompleted = await ProgressRepository.countTotalCompleted();

    const totalAdmins = allUsers.filter((u) => u.role === 'admin').length;
    const totalStandardUsers = allUsers.length - totalAdmins;
    const totalContentItems = globalSubjects.length + globalLectures.length + globalProblems.length;

    // Fetch weekly most active users
    const mostActiveUsers = await ProgressRepository.getWeeklyActiveUsers(allUsers, 7);

    // Recent audit actions snippet
    const recentAuditLogs = await AuditLogRepository.listRecent(5);

    res.json({
      metrics: {
        totalUsers: allUsers.length,
        totalAdmins,
        totalStandardUsers,
        totalContentItems,
        globalSubjectsCount: globalSubjects.length,
        globalLecturesCount: globalLectures.length,
        globalProblemsCount: globalProblems.length,
        totalProgressCompleted,
      },
      mostActiveUsers: mostActiveUsers.slice(0, 8),
      recentAuditLogs,
    });
  } catch (error) {
    console.error('[Admin overview error]:', error);
    res.status(500).json({ message: 'Failed to fetch admin overview metrics' });
  }
});

// ======================================================================
// 2. GLOBAL CONTENT ROUTES (Shared Curated Content)
// ======================================================================
router.get('/content', authenticateToken, authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const [subjects, lectures, problems] = await Promise.all([
      SubjectRepository.listGlobal(),
      LectureRepository.listGlobal(),
      ProblemRepository.listGlobal(),
    ]);

    // Attach lecture counts to subjects
    const subjectsWithCounts = subjects.map((sub) => {
      const subLectures = lectures.filter((l) => l.subjectId === sub.id);
      return {
        ...sub,
        lecturesCount: subLectures.length,
      };
    });

    res.json({
      subjects: subjectsWithCounts,
      lectures,
      problems,
    });
  } catch (error) {
    console.error('[Admin content error]:', error);
    res.status(500).json({ message: 'Failed to load global content items' });
  }
});

// Global Subjects CRUD
router.post('/content/subjects', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Subject name is required' });
      return;
    }

    const created = await SubjectRepository.createGlobal(name.trim());

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'create_global_content',
      details: `Created global subject: "${created.name}"`,
    });

    res.status(201).json({ subject: created, message: 'Global subject created successfully' });
  } catch (error) {
    console.error('[Create global subject error]:', error);
    res.status(500).json({ message: 'Failed to create global subject' });
  }
});

router.put('/content/subjects/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { id } = req.params;
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Subject name is required' });
      return;
    }

    const updated = await SubjectRepository.updateGlobal(id, name.trim());
    if (!updated) {
      res.status(404).json({ message: 'Global subject not found' });
      return;
    }

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'update_global_content',
      details: `Updated global subject name to: "${updated.name}"`,
    });

    res.json({ subject: updated, message: 'Global subject updated successfully' });
  } catch (error) {
    console.error('[Update global subject error]:', error);
    res.status(500).json({ message: 'Failed to update global subject' });
  }
});

router.delete('/content/subjects/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { id } = req.params;

    const success = await SubjectRepository.deleteGlobal(id);
    if (!success) {
      res.status(404).json({ message: 'Global subject not found or could not be removed' });
      return;
    }

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'delete_global_content',
      details: `Deleted global subject ID: ${id} and cascaded its associated lectures`,
    });

    res.json({ message: 'Global subject and its lectures removed successfully' });
  } catch (error) {
    console.error('[Delete global subject error]:', error);
    res.status(500).json({ message: 'Failed to delete global subject' });
  }
});

// Global Lectures CRUD
router.post('/content/lectures', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { subjectId, title, session, videoUrl } = req.body || {};

    if (!subjectId || !title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Subject and lecture title are required' });
      return;
    }

    const created = await LectureRepository.createGlobal({
      subjectId,
      title: title.trim(),
      session: typeof session === 'number' ? session : undefined,
      videoUrl: typeof videoUrl === 'string' ? videoUrl.trim() : '',
    });

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'create_global_content',
      details: `Added global lecture "${created.title}" (Session ${created.session})`,
    });

    res.status(201).json({ lecture: created, message: 'Global lecture created successfully' });
  } catch (error) {
    console.error('[Create global lecture error]:', error);
    res.status(500).json({ message: 'Failed to create global lecture' });
  }
});

router.put('/content/lectures/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { id } = req.params;
    const { title, session, videoUrl } = req.body || {};

    const updated = await LectureRepository.updateGlobal(id, {
      title,
      session: typeof session === 'number' ? session : undefined,
      videoUrl,
    });

    if (!updated) {
      res.status(404).json({ message: 'Global lecture not found' });
      return;
    }

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'update_global_content',
      details: `Updated global lecture "${updated.title}"`,
    });

    res.json({ lecture: updated, message: 'Global lecture updated successfully' });
  } catch (error) {
    console.error('[Update global lecture error]:', error);
    res.status(500).json({ message: 'Failed to update global lecture' });
  }
});

router.delete('/content/lectures/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { id } = req.params;

    const success = await LectureRepository.deleteGlobal(id);
    if (!success) {
      res.status(404).json({ message: 'Global lecture not found or could not be deleted' });
      return;
    }

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'delete_global_content',
      details: `Deleted global lecture ID: ${id}`,
    });

    res.json({ message: 'Global lecture removed successfully' });
  } catch (error) {
    console.error('[Delete global lecture error]:', error);
    res.status(500).json({ message: 'Failed to delete global lecture' });
  }
});

// Global Problems CRUD
router.post('/content/problems', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { name, difficulty, category, link } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Problem name is required' });
      return;
    }
    if (!difficulty || !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ message: 'Difficulty must be Easy, Medium, or Hard' });
      return;
    }

    const created = await ProblemRepository.createGlobal({
      name: name.trim(),
      difficulty,
      category: (category || 'General').trim(),
      link: typeof link === 'string' ? link.trim() : '',
    });

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'create_global_content',
      details: `Created global problem: "${created.name}" (${created.difficulty})`,
    });

    res.status(201).json({ problem: created, message: 'Global problem created successfully' });
  } catch (error) {
    console.error('[Create global problem error]:', error);
    res.status(500).json({ message: 'Failed to create global problem' });
  }
});

router.put('/content/problems/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { id } = req.params;
    const { name, difficulty, category, link } = req.body || {};

    const updated = await ProblemRepository.updateGlobal(id, {
      name,
      difficulty,
      category,
      link,
    });

    if (!updated) {
      res.status(404).json({ message: 'Global problem not found' });
      return;
    }

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'update_global_content',
      details: `Updated global problem: "${updated.name}" (${updated.difficulty})`,
    });

    res.json({ problem: updated, message: 'Global problem updated successfully' });
  } catch (error) {
    console.error('[Update global problem error]:', error);
    res.status(500).json({ message: 'Failed to update global problem' });
  }
});

router.delete('/content/problems/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { id } = req.params;

    const success = await ProblemRepository.deleteGlobal(id);
    if (!success) {
      res.status(404).json({ message: 'Global problem not found or could not be deleted' });
      return;
    }

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'delete_global_content',
      details: `Deleted global problem ID: ${id}`,
    });

    res.json({ message: 'Global problem deleted successfully' });
  } catch (error) {
    console.error('[Delete global problem error]:', error);
    res.status(500).json({ message: 'Failed to delete global problem' });
  }
});

// ======================================================================
// 3. USERS MANAGEMENT & COMPARISON ROUTES
// ======================================================================
router.get('/users', authenticateToken, authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await UserRepository.listAllUsers();

    const totalLecturesInSystem = await LectureRepository.countTotal();
    const totalProblemsInSystem = await ProblemRepository.countTotal();
    const totalAcademicItems = totalLecturesInSystem + totalProblemsInSystem;

    const userStatsPromises = users.map(async (u) => {
      const uId = u.id;
      const lecturesDone = await ProgressRepository.countCompleted(uId, 'lecture');
      const problemsSolved = await ProgressRepository.countCompleted(uId, 'problem');

      const lecturesCompletedPercent =
        totalLecturesInSystem > 0
          ? Math.round(((lecturesDone / totalLecturesInSystem) * 100) * 10) / 10
          : 0.0;

      const problemsSolvedPercent =
        totalProblemsInSystem > 0
          ? Math.round(((problemsSolved / totalProblemsInSystem) * 100) * 10) / 10
          : 0.0;

      const userAcademicDone = lecturesDone + problemsSolved;
      const overallReadinessPercent =
        totalAcademicItems > 0
          ? Math.min(100, Math.round(((userAcademicDone / totalAcademicItems) * 100) * 10) / 10)
          : 0.0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        mustChangePassword: Boolean(u.mustChangePassword),
        lecturesDone,
        totalLectures: totalLecturesInSystem,
        lecturesCompletedPercent,
        problemsSolved,
        totalProblems: totalProblemsInSystem,
        problemsSolvedPercent,
        overallReadinessPercent,
        createdAt: u.createdAt,
      };
    });

    const userComparison = await Promise.all(userStatsPromises);

    res.json({
      users: userComparison,
      totals: {
        usersCount: users.length,
        lecturesCount: totalLecturesInSystem,
        problemsCount: totalProblemsInSystem,
      },
    });
  } catch (error) {
    console.error('[Admin users comparison error]:', error);
    res.status(500).json({ message: 'Failed to fetch user comparison data' });
  }
});

router.post('/create-admin', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { name, email, temporaryPassword } = req.body || {};
    const fieldErrors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      fieldErrors.name = 'Full name is required';
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      fieldErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      fieldErrors.email = 'Please provide a valid email address';
    }

    if (!temporaryPassword || typeof temporaryPassword !== 'string') {
      fieldErrors.temporaryPassword = 'A temporary password is required';
    } else if (temporaryPassword.length < 6) {
      fieldErrors.temporaryPassword = 'Temporary password must be at least 6 characters long';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({ fieldErrors });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserRepository.findByEmail(normalizedEmail);
    if (existing) {
      res.status(400).json({
        fieldErrors: {
          email: 'An account with this email address already exists. You can promote their role instead.',
        },
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const newAdmin = await UserRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin',
      mustChangePassword: true,
    });

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'create_admin',
      targetUserId: newAdmin.id,
      targetEmail: newAdmin.email,
      details: `Administrator ${currentAdmin.name} created a new admin account for ${newAdmin.name} (${newAdmin.email}) with temporary password.`,
    });

    res.status(201).json({
      message: 'Admin account successfully created.',
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        mustChangePassword: true,
        createdAt: newAdmin.createdAt,
      },
      temporaryPassword,
    });
  } catch (error) {
    console.error('[Create admin error]:', error);
    res.status(500).json({ message: 'Server error while creating administrator account' });
  }
});

router.post('/users/:id/role', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const targetUserId = req.params.id;
    const { role } = req.body || {};

    if (role !== 'admin' && role !== 'user' && role !== 'student') {
      res.status(400).json({ message: 'Invalid role specified. Must be "admin" or "user".' });
      return;
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ message: 'Target user not found' });
      return;
    }

    if (targetUser.id === currentAdmin.id && role !== 'admin') {
      res.status(400).json({
        message: 'Security protection: You cannot revoke your own administrator privileges. Another administrator must perform this action.',
      });
      return;
    }

    const previousRole = targetUser.role;
    const updatedUser = await UserRepository.updateRole(targetUserId, role as UserRole);

    if (!updatedUser) {
      res.status(500).json({ message: 'Failed to update user role in database' });
      return;
    }

    const isPromotion = role === 'admin';
    const action = isPromotion ? 'promote_admin' : 'revoke_admin';
    const actionLabel = isPromotion
      ? `Promoted user ${targetUser.name} (${targetUser.email}) from ${previousRole} to administrator`
      : `Revoked administrator privileges from ${targetUser.name} (${targetUser.email}) to standard user`;

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      details: actionLabel,
    });

    res.status(200).json({
      message: isPromotion
        ? `Successfully promoted ${targetUser.name} to Administrator.`
        : `Administrator privileges successfully revoked for ${targetUser.name}.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        mustChangePassword: updatedUser.mustChangePassword,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Update role error]:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// ======================================================================
// 4. AUDIT LOGS ROUTE
// ======================================================================
router.get('/audit-logs', authenticateToken, authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const logs = await AuditLogRepository.listRecent(100);
    res.status(200).json({ logs });
  } catch (error) {
    console.error('[Admin audit logs error]:', error);
    res.status(500).json({ message: 'Failed to load audit logs' });
  }
});

export default router;

