import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateToken, authenticateAdmin } from './auth.ts';
import { UserRepository } from '../models/User.ts';
import { LectureModel, ProblemModel, ProgressModel } from '../models/index.ts';

const router = Router();

// GET /api/admin/users - Admin-only user comparison list
router.get('/users', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const users = await UserRepository.listAllUsers();

    // 1. Get total system benchmarks
    const totalLecturesInSystem = await LectureModel.countDocuments();
    const totalProblemsInSystem = await ProblemModel.countDocuments();
    const totalAcademicItems = totalLecturesInSystem + totalProblemsInSystem;

    // 2. Fetch progress stats for each user
    const userStatsPromises = users.map(async (u) => {
      const uId = u.id;
      const userObjectId = mongoose.isValidObjectId(uId) ? new mongoose.Types.ObjectId(uId) : uId;

      // Count completed lectures for this user
      const lecturesDone = await ProgressModel.countDocuments({
        $or: [{ userId: userObjectId }, { userId: uId }],
        itemType: 'lecture',
        status: 'completed',
      });

      // Count solved problems for this user
      const problemsSolved = await ProgressModel.countDocuments({
        $or: [{ userId: userObjectId }, { userId: uId }],
        itemType: 'problem',
        status: 'completed',
      });

      // Calculate percentages formatted with single decimal precision
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

export default router;
