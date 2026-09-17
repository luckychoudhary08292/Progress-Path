import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './auth.ts';
import { ProblemModel, ProgressModel, ProblemDifficulty } from '../models/index.ts';

const router = Router();

const STATUS_CYCLE: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'completed',
  completed: 'revision',
  revision: 'todo',
};

// GET /api/problems - Fetch all problems (global + user's own) sorted by createdAt ascending
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // CRITICAL: Always fetch problems sorted by createdAt ascending (oldest first)
    const problems = await ProblemModel.find({
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    })
      .sort({ createdAt: 1 })
      .lean();

    const problemIds = problems.map((p) => p._id);

    // Fetch this user's progress records for all these problems
    const progressRecords = await ProgressModel.find({
      $or: [{ userId: userObjectId }, { userId: userId }],
      itemType: 'problem',
      itemId: { $in: problemIds },
    }).lean();

    const progressMap = new Map<string, string>();
    for (const prog of progressRecords) {
      progressMap.set(prog.itemId.toString(), prog.status || 'todo');
    }

    const categorySet = new Set<string>();

    const problemList = problems.map((prob) => {
      if (prob.category) {
        categorySet.add(prob.category.trim());
      }

      const status = progressMap.get(prob._id.toString()) || 'todo';
      const isOwner =
        !prob.isGlobal &&
        prob.createdBy &&
        prob.createdBy.toString() === userId.toString();

      return {
        id: prob._id.toString(),
        name: prob.name,
        difficulty: prob.difficulty,
        category: prob.category,
        link: prob.link || '',
        isGlobal: !!prob.isGlobal,
        isOwner: !!isOwner,
        status,
        createdAt: prob.createdAt,
      };
    });

    const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

    res.json({
      problems: problemList,
      categories,
    });
  } catch (err) {
    console.log('[Problems GET Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch coding problems' });
  }
});

// POST /api/problems - Add custom problem (name, difficulty, category, optional link)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { name, difficulty, category, link } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Problem name is required' });
      return;
    }

    const validDifficulties: ProblemDifficulty[] = ['Easy', 'Medium', 'Hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      res.status(400).json({ message: 'Difficulty must be Easy, Medium, or Hard' });
      return;
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ message: 'Category is required' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const newProblem = await ProblemModel.create({
      name: name.trim(),
      difficulty,
      category: category.trim(),
      link: typeof link === 'string' ? link.trim() : '',
      isGlobal: false,
      createdBy: userObjectId,
      createdAt: new Date(),
    });

    res.status(201).json({
      id: newProblem._id.toString(),
      name: newProblem.name,
      difficulty: newProblem.difficulty,
      category: newProblem.category,
      link: newProblem.link,
      isGlobal: false,
      isOwner: true,
      status: 'todo',
      createdAt: newProblem.createdAt,
    });
  } catch (err) {
    console.log('[Problems POST Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to create problem' });
  }
});

// POST /api/problems/bulk - Bulk add coding problems
router.post('/bulk', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items array is required' });
      return;
    }

    if (items.length > 500) {
      res.status(400).json({ message: 'Bulk import is capped at 500 items per batch' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const validDifficulties: ProblemDifficulty[] = ['Easy', 'Medium', 'Hard'];
    const insertedItems: Array<{ id: string; name: string; difficulty: string; category: string }> = [];
    const failedItems: Array<{ index: number; name: string; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemNumber = i + 1;
      const { name, difficulty, category, link } = item || {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        failedItems.push({
          index: itemNumber,
          name: String(name || `Item #${itemNumber}`),
          error: "Missing required 'name'",
        });
        continue;
      }

      if (!difficulty || !validDifficulties.includes(difficulty)) {
        failedItems.push({
          index: itemNumber,
          name: name.trim(),
          error: "Difficulty must be 'Easy', 'Medium', or 'Hard'",
        });
        continue;
      }

      const cat = typeof category === 'string' && category.trim() ? category.trim() : 'General';

      try {
        const newProblem = await ProblemModel.create({
          name: name.trim(),
          difficulty,
          category: cat,
          link: typeof link === 'string' ? link.trim() : '',
          isGlobal: false,
          createdBy: userObjectId,
          createdAt: new Date(),
        });

        insertedItems.push({
          id: newProblem._id.toString(),
          name: newProblem.name,
          difficulty: newProblem.difficulty,
          category: newProblem.category,
        });
      } catch (itemErr) {
        failedItems.push({
          index: itemNumber,
          name: name.trim(),
          error: itemErr instanceof Error ? itemErr.message : 'Database write failure',
        });
      }
    }

    const success = failedItems.length === 0;
    const statusCode = success ? 201 : insertedItems.length > 0 ? 207 : 500;

    res.status(statusCode).json({
      success,
      message: success
        ? `Successfully imported all ${insertedItems.length} problems`
        : `Imported ${insertedItems.length} problems with ${failedItems.length} failures`,
      insertedCount: insertedItems.length,
      failedCount: failedItems.length,
      insertedItems,
      failedItems,
    });
  } catch (err) {
    console.log('[Problems Bulk POST Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Internal server error during bulk import' });
  }
});

// PATCH /api/problems/:id/status - Cycle or set status for this user only
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const problemId = req.params.id;
    const { status: requestedStatus } = req.body;

    if (!mongoose.isValidObjectId(problemId)) {
      res.status(404).json({ message: 'Problem not found' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    const problemObjectId = new mongoose.Types.ObjectId(problemId);

    // Verify problem exists
    const problem = await ProblemModel.findById(problemObjectId).select('_id');
    if (!problem) {
      res.status(404).json({ message: 'Problem not found' });
      return;
    }

    let nextStatus = requestedStatus;

    // If no specific status is requested, cycle through: todo -> in_progress -> completed -> revision -> todo
    if (!nextStatus) {
      const existingProg = await ProgressModel.findOne({
        userId: userObjectId,
        itemType: 'problem',
        itemId: problemObjectId,
      });

      const currentStatus = existingProg?.status || 'todo';
      nextStatus = STATUS_CYCLE[currentStatus] || 'todo';
    }

    const validStatuses = ['todo', 'in_progress', 'completed', 'revision'];
    if (!validStatuses.includes(nextStatus)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    // Upsert into Progress collection - strictly for this user, never modifying the shared problem document
    const updatedProgress = await ProgressModel.findOneAndUpdate(
      {
        userId: userObjectId,
        itemType: 'problem',
        itemId: problemObjectId,
      },
      {
        $set: {
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date() : null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      problemId,
      status: updatedProgress.status,
    });
  } catch (err) {
    console.log('[Problems PATCH Status Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to update problem status' });
  }
});

// DELETE /api/problems/:id - Delete problem if current user created it
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const problemId = req.params.id;

    if (!mongoose.isValidObjectId(problemId)) {
      res.status(404).json({ message: 'Problem not found' });
      return;
    }

    const problemObjectId = new mongoose.Types.ObjectId(problemId);
    const problem = await ProblemModel.findById(problemObjectId);

    if (!problem) {
      res.status(404).json({ message: 'Problem not found' });
      return;
    }

    if (!problem.createdBy || problem.createdBy.toString() !== userId.toString()) {
      res.status(403).json({ message: 'You can only delete problems you created' });
      return;
    }

    await ProblemModel.findByIdAndDelete(problemObjectId);
    await ProgressModel.deleteMany({ itemId: problemObjectId });

    res.json({ message: 'Problem deleted successfully', deletedId: problemId });
  } catch (err) {
    console.log('[Problems DELETE Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to delete problem' });
  }
});

export default router;
