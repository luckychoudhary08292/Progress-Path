import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import { authenticateToken } from './auth.ts';
import {
  ProblemRepository,
  ProgressRepository,
} from '../repositories.ts';
import type { ProblemDifficulty } from '../models/index.ts';
import { sanitizeHtml, sanitizeSafeUrl } from '../middleware/security.ts';
import { SYSTEM_LIMITS } from '../config/limits.ts';

const router = Router();

const STATUS_CYCLE: Record<string, 'todo' | 'in_progress' | 'completed' | 'revision'> = {
  todo: 'in_progress',
  in_progress: 'completed',
  completed: 'revision',
  revision: 'todo',
};

// GET /api/problems - Fetch all problems sorted by createdAt ascending
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    const problems = await ProblemRepository.listForUser(userId);
    const problemIds = problems.map((p) => p.id);
    const progressMap = await ProgressRepository.getStatusMap(userId, 'problem', problemIds);

    const categorySet = new Set<string>();

    const problemList = problems.map((prob) => {
      if (prob.category) {
        categorySet.add(prob.category.trim());
      }

      const prog = progressMap.get(prob.id);
      const status = (prog?.status as 'todo' | 'in_progress' | 'completed' | 'revision') || 'todo';

      return {
        id: prob.id,
        name: prob.name,
        difficulty: prob.difficulty,
        category: prob.category,
        link: prob.link || '',
        isGlobal: !!prob.isGlobal,
        isOwner: !!prob.isOwner,
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

// POST /api/problems - Add custom problem
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { name, title, difficulty, category, link, tags } = req.body || {};

    const rawName = (name || title || '').toString();
    if (!rawName.trim()) {
      res.status(400).json({ message: 'Problem name is required' });
      return;
    }

    if (rawName.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({
        message: `Problem name must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters`,
      });
      return;
    }

    const rawCategory = (category || (Array.isArray(tags) && tags[0]) || 'General').toString();
    if (rawCategory.trim().length > SYSTEM_LIMITS.MAX_CATEGORY_LENGTH) {
      res.status(400).json({
        message: `Category must not exceed ${SYSTEM_LIMITS.MAX_CATEGORY_LENGTH} characters`,
      });
      return;
    }

    const urlCheck = sanitizeSafeUrl(link);
    if (!urlCheck.valid) {
      res.status(400).json({
        message: 'Invalid problem URL. Only http:// and https:// links are allowed.',
      });
      return;
    }

    const currentCount = await ProblemRepository.countCreatedByUser(userId);
    if (currentCount >= SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER) {
      res.status(403).json({
        message: `Problem limit reached (${SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER} custom problems max per user)`,
        limitReached: true,
        limit: SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER,
      });
      return;
    }

    const validDifficulties: ProblemDifficulty[] = ['Easy', 'Medium', 'Hard'];
    const resolvedDifficulty: ProblemDifficulty = validDifficulties.includes(difficulty)
      ? difficulty
      : 'Medium';

    const cleanName = sanitizeHtml(rawName.trim());
    const cleanCategory = sanitizeHtml(rawCategory.trim() || 'General');

    const newProblem = await ProblemRepository.create({
      name: cleanName,
      difficulty: resolvedDifficulty,
      category: cleanCategory,
      link: urlCheck.value,
      createdBy: userId,
    });

    res.status(201).json({
      id: newProblem.id,
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
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items array is required' });
      return;
    }

    if (items.length > SYSTEM_LIMITS.MAX_BULK_ITEMS) {
      res.status(400).json({
        message: `Bulk import is capped at ${SYSTEM_LIMITS.MAX_BULK_ITEMS} items per batch`,
      });
      return;
    }

    const currentCount = await ProblemRepository.countCreatedByUser(userId);
    if (currentCount + items.length > SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER) {
      const remaining = Math.max(0, SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER - currentCount);
      res.status(403).json({
        message: `Custom problem quota exceeded (${SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER} max; ${remaining} slot(s) remaining)`,
        limitReached: true,
        limit: SYSTEM_LIMITS.MAX_PROBLEMS_PER_USER,
        remaining,
      });
      return;
    }

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

      if (name.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
        failedItems.push({
          index: itemNumber,
          name: name.trim().slice(0, 60),
          error: `Name exceeds ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters`,
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

      const urlCheck = sanitizeSafeUrl(link);
      if (!urlCheck.valid) {
        failedItems.push({
          index: itemNumber,
          name: name.trim(),
          error: 'Invalid URL protocol (only http/https allowed)',
        });
        continue;
      }

      const cat = typeof category === 'string' && category.trim() ? category.trim() : 'General';
      if (cat.length > SYSTEM_LIMITS.MAX_CATEGORY_LENGTH) {
        failedItems.push({
          index: itemNumber,
          name: name.trim(),
          error: `Category exceeds ${SYSTEM_LIMITS.MAX_CATEGORY_LENGTH} characters`,
        });
        continue;
      }

      const cleanName = sanitizeHtml(name.trim());
      const cleanCat = sanitizeHtml(cat);

      try {
        const newProb = await ProblemRepository.create({
          name: cleanName,
          difficulty,
          category: cleanCat,
          link: urlCheck.value,
          createdBy: userId,
        });

        insertedItems.push({
          id: newProb.id,
          name: newProb.name,
          difficulty: newProb.difficulty,
          category: newProb.category,
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
    const statusCode = success ? 201 : insertedItems.length > 0 ? 207 : 400;

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
    const { status: requestedStatus } = req.body || {};

    if (!problemId) {
      res.status(400).json({ message: 'Problem ID is required' });
      return;
    }

    const problem = await ProblemRepository.findByIdForUser(problemId, userId);
    if (!problem) {
      res.status(404).json({ message: 'Problem not found or inaccessible' });
      return;
    }

    let nextStatus = requestedStatus;

    if (!nextStatus) {
      const progMap = await ProgressRepository.getStatusMap(userId, 'problem', [problemId]);
      const currentStatus = progMap.get(problemId)?.status || 'todo';
      nextStatus = STATUS_CYCLE[currentStatus] || 'todo';
    }

    const validStatuses = ['todo', 'in_progress', 'completed', 'revision'];
    if (!validStatuses.includes(nextStatus)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const updated = await ProgressRepository.updateProgress(userId, 'problem', problemId, {
      status: nextStatus as any,
    });

    res.json({
      problemId,
      status: updated.status,
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

    if (!problemId) {
      res.status(400).json({ message: 'Problem ID is required' });
      return;
    }

    const deleted = await ProblemRepository.delete(problemId, userId);
    if (deleted === null) {
      res.status(403).json({ message: 'You can only delete problems you created' });
      return;
    }
    if (!deleted) {
      res.status(404).json({ message: 'Problem not found' });
      return;
    }

    res.json({ message: 'Problem deleted successfully', deletedId: problemId });
  } catch (err) {
    console.log('[Problems DELETE Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to delete problem' });
  }
});

export default router;
