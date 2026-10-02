import { Router, Request, Response } from 'express';
import { authenticateToken } from './auth.ts';
import {
  SubjectRepository,
  LectureRepository,
  ProblemRepository,
  EventRepository,
  ProgressRepository,
} from '../repositories.ts';

const router = Router();

// GET /api/dashboard
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    // Use requested client date or fallback to YYYY-MM-DD
    const dateParam = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const todayStr = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().split('T')[0];

    // Run primary user queries and progress lookups in parallel
    const [subjects, problems, todayEvents, completedLectureIds, completedProblemIds] =
      await Promise.all([
        SubjectRepository.listForUser(userId),
        ProblemRepository.listForUser(userId),
        EventRepository.listForUser(userId, todayStr),
        ProgressRepository.getCompletedItemIds(userId, 'lecture'),
        ProgressRepository.getCompletedItemIds(userId, 'problem'),
      ]);

    // 2. Fetch all lectures across subjects in a single query
    const subjectIds = subjects.map((s) => s.id);
    const allLectures = await LectureRepository.listForSubjects(subjectIds, userId);
    const totalLectures = allLectures.length;
    let lecturesDone = 0;
    for (const l of allLectures) {
      if (completedLectureIds.has(l.id)) lecturesDone++;
    }

    // 3. Problems: total vs solved
    const totalProblems = problems.length;
    let problemsSolved = 0;
    for (const p of problems) {
      if (completedProblemIds.has(p.id)) problemsSolved++;
    }

    // 4. Today's tasks (events)
    const todayTasksDone = todayEvents.filter((e) => e.completed).length;
    const todayTasksTotal = todayEvents.length;

    // 5. Readiness %
    const totalAcademicItems = totalLectures + totalProblems;
    const completedAcademicItems = lecturesDone + problemsSolved;
    let readinessPercent = 0;

    if (totalAcademicItems > 0) {
      readinessPercent = Math.min(100, Math.round((completedAcademicItems / totalAcademicItems) * 100));
    } else if (todayTasksTotal > 0) {
      readinessPercent = Math.min(100, Math.round((todayTasksDone / todayTasksTotal) * 100));
    }

    const hasZeroData =
      subjects.length === 0 &&
      totalLectures === 0 &&
      totalProblems === 0 &&
      todayTasksTotal === 0;

    res.json({
      readinessPercent,
      lectures: {
        done: lecturesDone,
        total: totalLectures,
      },
      problems: {
        solved: problemsSolved,
        total: totalProblems,
      },
      todayTasks: {
        done: todayTasksDone,
        total: todayTasksTotal,
      },
      todayEvents,
      hasZeroData,
    });
  } catch (err) {
    console.log('[Dashboard Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// PATCH /api/dashboard/events/:id/toggle
router.patch('/events/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const eventId = req.params.id;

    if (!eventId) {
      res.status(400).json({ message: 'Event ID is required' });
      return;
    }

    const toggled = await EventRepository.toggle(eventId, userId);
    if (!toggled) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({
      id: toggled.id,
      title: toggled.title,
      date: toggled.date,
      type: toggled.type,
      completed: toggled.completed,
    });
  } catch (err) {
    console.log('[Dashboard Event Toggle Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to update event status' });
  }
});

export default router;
