import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './auth.ts';
import {
  SubjectModel,
  LectureModel,
  ProblemModel,
  EventModel,
  ProgressModel,
} from '../models/index.ts';

const router = Router();

// GET /api/dashboard
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const userObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    // Use requested client date or fallback to YYYY-MM-DD
    const dateParam = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const todayStr = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().split('T')[0];

    // 1. Subjects available to user
    const subjects = await SubjectModel.find({
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    }).select('_id');
    const subjectIds = subjects.map((s) => s._id);

    // 2. Lectures: total vs done
    const totalLectures = await LectureModel.countDocuments({
      $or: [
        { subjectId: { $in: subjectIds } },
        { createdBy: userObjectId },
        { createdBy: userId },
      ],
    });

    const lecturesDone = await ProgressModel.countDocuments({
      $or: [{ userId: userObjectId }, { userId: userId }],
      itemType: 'lecture',
      status: 'completed',
    });

    // 3. Problems: total vs solved
    const totalProblems = await ProblemModel.countDocuments({
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    });

    const problemsSolved = await ProgressModel.countDocuments({
      $or: [{ userId: userObjectId }, { userId: userId }],
      itemType: 'problem',
      status: 'completed',
    });

    // 4. Today's tasks (events)
    const todayEventsDocs = await EventModel.find({
      $or: [{ userId: userObjectId }, { userId: userId }],
      date: todayStr,
    }).sort({ createdAt: 1 });

    const todayEvents = todayEventsDocs.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      date: e.date,
      type: e.type,
      completed: !!e.completed,
    }));

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

    // Determine if user has zero data anywhere in the app
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

    const userObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    let event = null;
    if (mongoose.isValidObjectId(eventId)) {
      event = await EventModel.findOne({
        _id: eventId,
        $or: [{ userId: userObjectId }, { userId: userId }],
      });
    }

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Toggle completed state
    event.completed = !event.completed;
    await event.save();

    res.json({
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      type: event.type,
      completed: event.completed,
    });
  } catch (err) {
    console.log('[Dashboard Event Toggle Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to update event status' });
  }
});

export default router;
