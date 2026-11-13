import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import bcrypt from 'bcryptjs';
import { authenticateToken, authenticateAdmin } from './auth.ts';
import { UserRepository } from '../models/User.ts';
import type { UserRole } from '../models/User.ts';
import { AuditLogRepository } from '../models/AuditLog.ts';
import {
  SubjectRepository,
  LectureRepository,
  ProblemRepository,
  ProgressRepository,
  EventRepository,
} from '../repositories.ts';
import { sanitizeSafeUrl } from '../middleware/security.ts';
import { SYSTEM_LIMITS } from '../config/limits.ts';

const router = Router();

// Airtight route protection: enforce token authentication AND admin role for all admin routes
router.use(authenticateToken, authenticateAdmin);

// ======================================================================
// 1. OVERVIEW DASHBOARD ROUTE (Default Tab)
// ======================================================================
router.get(['/overview', '/system-stats'], authenticateToken, authenticateAdmin, async (_req: Request, res: Response) => {
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
        maxUsers: SYSTEM_LIMITS.MAX_USERS,
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
    if (name.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({ message: `Subject name must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
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
    if (name.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({ message: `Subject name must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
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
    if (title.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({ message: `Lecture title must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
      return;
    }

    const urlCheck = sanitizeSafeUrl(videoUrl);
    if (!urlCheck.valid) {
      res.status(400).json({ message: 'Invalid video URL. Only http:// or https:// links are allowed.' });
      return;
    }

    const created = await LectureRepository.createGlobal({
      subjectId,
      title: title.trim(),
      session: typeof session === 'number' ? session : undefined,
      videoUrl: urlCheck.value,
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

    if (typeof title === 'string' && title.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({ message: `Lecture title must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
      return;
    }

    let safeUrl: string | undefined = undefined;
    if (videoUrl !== undefined) {
      const urlCheck = sanitizeSafeUrl(videoUrl);
      if (!urlCheck.valid) {
        res.status(400).json({ message: 'Invalid video URL. Only http:// or https:// links are allowed.' });
        return;
      }
      safeUrl = urlCheck.value;
    }

    const updated = await LectureRepository.updateGlobal(id, {
      title: typeof title === 'string' ? title.trim() : undefined,
      session: typeof session === 'number' ? session : undefined,
      videoUrl: safeUrl,
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

// ======================================================================
// GLOBAL IMPORTER ROUTES (Launch Curricula & Problems Globally)
// ======================================================================

// POST /api/admin/content/import/playlist - Import YouTube playlist into a global subject
router.post('/content/import/playlist', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { subjectId, newSubjectName, items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items array is required with at least one lecture' });
      return;
    }

    if (items.length > SYSTEM_LIMITS.MAX_BULK_ITEMS) {
      res.status(400).json({ message: `Import is capped at ${SYSTEM_LIMITS.MAX_BULK_ITEMS} items per request` });
      return;
    }

    let targetSubjectId = subjectId;
    let targetSubjectName = '';

    if (newSubjectName && typeof newSubjectName === 'string' && newSubjectName.trim()) {
      if (newSubjectName.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
        res.status(400).json({ message: `Subject name must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
        return;
      }
      const createdSub = await SubjectRepository.createGlobal(newSubjectName.trim());
      targetSubjectId = createdSub.id;
      targetSubjectName = createdSub.name;
    } else if (subjectId) {
      const globalSubs = await SubjectRepository.listGlobal();
      const existing = globalSubs.find((s) => s.id === subjectId);
      if (!existing) {
        res.status(404).json({ message: 'Selected global subject not found' });
        return;
      }
      targetSubjectName = existing.name;
    } else {
      res.status(400).json({ message: 'Please select an existing global subject or provide a new global subject name' });
      return;
    }

    const sanitizedItems = items
      .filter((it: any) => it && typeof it.title === 'string' && it.title.trim())
      .map((it: any) => {
        const urlCheck = sanitizeSafeUrl(it.videoUrl);
        return {
          title: it.title.trim().slice(0, SYSTEM_LIMITS.MAX_TITLE_LENGTH),
          videoUrl: urlCheck.valid ? urlCheck.value : '',
          session: it.session,
        };
      });

    if (sanitizedItems.length === 0) {
      res.status(400).json({ message: 'No valid lecture items found to import' });
      return;
    }

    const inserted = await LectureRepository.createBulkGlobal(targetSubjectId, sanitizedItems);

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'create_global_content',
      details: `Admin ${currentAdmin.name} imported and launched ${inserted.length} global lectures to subject "${targetSubjectName}"`,
    });

    res.status(201).json({
      success: true,
      message: `Successfully launched ${inserted.length} global lectures into "${targetSubjectName}" for all students!`,
      subjectId: targetSubjectId,
      subjectName: targetSubjectName,
      insertedCount: inserted.length,
      lectures: inserted,
    });
  } catch (error) {
    console.error('[Admin import playlist error]:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to import global playlist' });
  }
});

// POST /api/admin/content/import/problems - Bulk import global coding problems
router.post('/content/import/problems', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const currentAdmin = (req as any).user;
    const { problems } = req.body || {};

    if (!Array.isArray(problems) || problems.length === 0) {
      res.status(400).json({ message: 'Problems array is required with at least one problem' });
      return;
    }

    if (problems.length > SYSTEM_LIMITS.MAX_BULK_ITEMS) {
      res.status(400).json({ message: `Import is capped at ${SYSTEM_LIMITS.MAX_BULK_ITEMS} problems per request` });
      return;
    }

    const validProblems = problems
      .filter((p: any) => p && typeof p.name === 'string' && p.name.trim())
      .map((p: any) => {
        const urlCheck = sanitizeSafeUrl(p.link);
        return {
          name: p.name.trim().slice(0, SYSTEM_LIMITS.MAX_TITLE_LENGTH),
          difficulty: (['Easy', 'Medium', 'Hard'].includes(p.difficulty) ? p.difficulty : 'Medium') as any,
          category:
            typeof p.category === 'string' && p.category.trim()
              ? p.category.trim().slice(0, SYSTEM_LIMITS.MAX_CATEGORY_LENGTH)
              : 'General',
          link: urlCheck.valid ? urlCheck.value : '',
        };
      });

    if (validProblems.length === 0) {
      res.status(400).json({ message: 'No valid problems found with required names' });
      return;
    }

    const inserted = await ProblemRepository.createBulkGlobal(validProblems);

    await AuditLogRepository.log({
      actorId: currentAdmin.id,
      actorName: currentAdmin.name,
      actorEmail: currentAdmin.email,
      action: 'create_global_content',
      details: `Admin ${currentAdmin.name} imported and launched ${inserted.length} global coding problems`,
    });

    res.status(201).json({
      success: true,
      message: `Successfully launched ${inserted.length} global coding problems for all students!`,
      insertedCount: inserted.length,
      problems: inserted,
    });
  } catch (error) {
    console.error('[Admin import problems error]:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to import global problems' });
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
    if (name.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({ message: `Problem name must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
      return;
    }
    if (!difficulty || !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      res.status(400).json({ message: 'Difficulty must be Easy, Medium, or Hard' });
      return;
    }

    const urlCheck = sanitizeSafeUrl(link);
    if (!urlCheck.valid) {
      res.status(400).json({ message: 'Invalid problem URL. Only http:// or https:// links are allowed.' });
      return;
    }

    const cleanCategory =
      typeof category === 'string' && category.trim()
        ? category.trim().slice(0, SYSTEM_LIMITS.MAX_CATEGORY_LENGTH)
        : 'General';

    const created = await ProblemRepository.createGlobal({
      name: name.trim(),
      difficulty,
      category: cleanCategory,
      link: urlCheck.value,
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

    if (typeof name === 'string' && name.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({ message: `Problem name must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters` });
      return;
    }

    let safeLink: string | undefined = undefined;
    if (link !== undefined) {
      const urlCheck = sanitizeSafeUrl(link);
      if (!urlCheck.valid) {
        res.status(400).json({ message: 'Invalid problem URL. Only http:// or https:// links are allowed.' });
        return;
      }
      safeLink = urlCheck.value;
    }

    const updated = await ProblemRepository.updateGlobal(id, {
      name: typeof name === 'string' ? name.trim() : undefined,
      difficulty,
      category: typeof category === 'string' ? category.trim().slice(0, SYSTEM_LIMITS.MAX_CATEGORY_LENGTH) : undefined,
      link: safeLink,
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

    const userStatsPromises = users.map(async (u) => {
      const uId = u.id;

      // 1. Individual user feed subjects (global + user-created)
      const userSubjects = await SubjectRepository.listForUser(uId);
      const subjectsCount = userSubjects.length;

      // 2. Individual user feed lectures (from the subjects in this user's feed)
      let userTotalLectures = 0;
      const userLectureIds: string[] = [];
      for (const subj of userSubjects) {
        const lecs = await LectureRepository.listForSubject(subj.id, uId);
        userTotalLectures += lecs.length;
        userLectureIds.push(...lecs.map((l) => l.id));
      }

      // 3. Individual user completed lectures from their feed
      const lecturesDone =
        userLectureIds.length > 0
          ? await ProgressRepository.countCompleted(uId, 'lecture', userLectureIds)
          : 0;

      // 4. Individual user feed problems (global + user-created)
      const userProblems = await ProblemRepository.listForUser(uId);
      const userTotalProblems = userProblems.length;
      const userProblemIds = userProblems.map((p) => p.id);

      // 5. Individual user solved problems from their feed
      const problemsSolved =
        userProblemIds.length > 0
          ? await ProgressRepository.countCompleted(uId, 'problem', userProblemIds)
          : 0;

      // 6. Percentages computed from individual user's personalized feed totals
      const lecturesCompletedPercent =
        userTotalLectures > 0
          ? Math.round(((lecturesDone / userTotalLectures) * 100) * 10) / 10
          : 0.0;

      const problemsSolvedPercent =
        userTotalProblems > 0
          ? Math.round(((problemsSolved / userTotalProblems) * 100) * 10) / 10
          : 0.0;

      const userAcademicTotal = userTotalLectures + userTotalProblems;
      const userAcademicDone = lecturesDone + problemsSolved;

      // 7. Individual user calendar tasks / events from their personal feed
      const userEvents = await EventRepository.listForUser(uId);
      const eventsCount = userEvents.length;
      const eventsDone = userEvents.filter((e) => e.completed).length;

      let overallReadinessPercent = 0.0;
      if (userAcademicTotal > 0) {
        overallReadinessPercent = Math.min(
          100,
          Math.round(((userAcademicDone / userAcademicTotal) * 100) * 10) / 10
        );
      } else if (eventsCount > 0) {
        overallReadinessPercent = Math.min(
          100,
          Math.round(((eventsDone / eventsCount) * 100) * 10) / 10
        );
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        mustChangePassword: Boolean(u.mustChangePassword),
        subjectsCount,
        lecturesDone,
        totalLectures: userTotalLectures,
        lecturesCompletedPercent,
        problemsSolved,
        totalProblems: userTotalProblems,
        problemsSolvedPercent,
        overallReadinessPercent,
        eventsCount,
        eventsDone,
        createdAt: u.createdAt,
      };
    });

    const userComparison = await Promise.all(userStatsPromises);

    const totalLecturesInSystem = await LectureRepository.countTotal();
    const totalProblemsInSystem = await ProblemRepository.countTotal();

    res.json({
      users: userComparison,
      totals: {
        usersCount: users.length,
        maxUsers: SYSTEM_LIMITS.MAX_USERS,
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
    } else if (name.trim().length > SYSTEM_LIMITS.MAX_NAME_LENGTH) {
      fieldErrors.name = `Name must not exceed ${SYSTEM_LIMITS.MAX_NAME_LENGTH} characters`;
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      fieldErrors.email = 'Email address is required';
    } else if (
      email.trim().length > SYSTEM_LIMITS.MAX_EMAIL_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      fieldErrors.email = 'Please provide a valid email address';
    }

    if (!temporaryPassword || typeof temporaryPassword !== 'string') {
      fieldErrors.temporaryPassword = 'A temporary password is required';
    } else if (temporaryPassword.length < SYSTEM_LIMITS.MIN_PASSWORD_LENGTH) {
      fieldErrors.temporaryPassword = `Temporary password must be at least ${SYSTEM_LIMITS.MIN_PASSWORD_LENGTH} characters long`;
    } else if (temporaryPassword.length > SYSTEM_LIMITS.MAX_PASSWORD_LENGTH) {
      fieldErrors.temporaryPassword = `Temporary password must not exceed ${SYSTEM_LIMITS.MAX_PASSWORD_LENGTH} characters`;
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

