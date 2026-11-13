import express from 'express';
import type { Request, Response } from 'express';
import { authenticateToken, authenticateAdmin } from './auth.ts';
import { FeedbackRepository } from '../models/Feedback.ts';
import { AuditLogRepository } from '../models/AuditLog.ts';
import { SYSTEM_LIMITS } from '../config/limits.ts';

const router = express.Router();

// POST /api/feedback - User submits new feedback
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { title, description } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({
        message: 'Feedback title is required',
        fieldErrors: { title: 'Please provide a descriptive title' },
      });
      return;
    }

    if (title.trim().length < 3) {
      res.status(400).json({
        message: 'Title must be at least 3 characters',
        fieldErrors: { title: 'Title must be at least 3 characters long' },
      });
      return;
    }

    if (title.trim().length > 180) {
      res.status(400).json({
        message: 'Title must not exceed 180 characters',
        fieldErrors: { title: 'Title must not exceed 180 characters' },
      });
      return;
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({
        message: 'Feedback description is required',
        fieldErrors: { description: 'Please provide details for your feedback' },
      });
      return;
    }

    if (description.trim().length < 5) {
      res.status(400).json({
        message: 'Description must be at least 5 characters',
        fieldErrors: { description: 'Description must be at least 5 characters long' },
      });
      return;
    }

    if (description.trim().length > 4000) {
      res.status(400).json({
        message: 'Description must not exceed 4000 characters',
        fieldErrors: { description: 'Description must not exceed 4000 characters' },
      });
      return;
    }

    const userId = user.id || user._id?.toString() || 'anonymous';
    const existingFeedbackCount = await FeedbackRepository.countByUserId(userId);
    if (existingFeedbackCount >= SYSTEM_LIMITS.MAX_FEEDBACK_PER_USER) {
      res.status(403).json({
        message: `Feedback submission limit reached (${SYSTEM_LIMITS.MAX_FEEDBACK_PER_USER} submissions max per user)`,
        limitReached: true,
        limit: SYSTEM_LIMITS.MAX_FEEDBACK_PER_USER,
      });
      return;
    }

    const feedback = await FeedbackRepository.create({
      userId,
      userName: user.name || 'Anonymous User',
      userEmail: user.email || '',
      title: title.trim(),
      description: description.trim(),
    });

    res.status(201).json({
      success: true,
      feedback: {
        id: feedback.id,
        userId: feedback.userId,
        userName: feedback.userName,
        userEmail: feedback.userEmail,
        title: feedback.title,
        description: feedback.description,
        createdAt: feedback.createdAt.toISOString(),
      },
      message: 'Feedback submitted successfully. Thank you for your feedback!',
    });
  } catch (error) {
    console.error('[Feedback Submission Error]:', error);
    res.status(500).json({ message: 'Internal server error processing feedback' });
  }
});

// GET /api/feedback/my - Get feedbacks submitted by current user
router.get('/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id || user._id?.toString();
    const feedbacks = await FeedbackRepository.listByUserId(userId);

    res.json({
      feedbacks: feedbacks.map((fb) => ({
        id: fb.id,
        userId: fb.userId,
        userName: fb.userName,
        userEmail: fb.userEmail,
        title: fb.title,
        description: fb.description,
        createdAt: fb.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Feedback Get My Error]:', error);
    res.status(500).json({ message: 'Failed to retrieve your feedback submissions' });
  }
});

// GET /api/feedback - Admin gets all feedbacks with user info
router.get('/', authenticateToken, authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    const feedbacks = await FeedbackRepository.listAll();
    res.json({
      feedbacks: feedbacks.map((fb) => ({
        id: fb.id,
        userId: fb.userId,
        userName: fb.userName,
        userEmail: fb.userEmail,
        title: fb.title,
        description: fb.description,
        status: fb.status || 'unseen',
        createdAt: fb.createdAt.toISOString(),
      })),
      total: feedbacks.length,
    });
  } catch (error) {
    console.error('[Admin Feedback List Error]:', error);
    res.status(500).json({ message: 'Failed to retrieve user feedbacks' });
  }
});

// PATCH /api/feedback/:id/status - Admin updates feedback status (unseen, seen, complete)
router.patch('/:id/status', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!id) {
      res.status(400).json({ message: 'Feedback ID is required' });
      return;
    }

    if (!status || !['unseen', 'seen', 'complete'].includes(status)) {
      res.status(400).json({ message: 'Valid status ("unseen", "seen", or "complete") is required' });
      return;
    }

    const updated = await FeedbackRepository.updateStatus(id, status);
    if (!updated) {
      res.status(404).json({ message: 'Feedback not found' });
      return;
    }

    res.json({
      success: true,
      message: `Feedback status updated to ${status}`,
      feedback: {
        id: updated.id,
        userId: updated.userId,
        userName: updated.userName,
        userEmail: updated.userEmail,
        title: updated.title,
        description: updated.description,
        status: updated.status || status,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin Feedback Update Status Error]:', error);
    res.status(500).json({ message: 'Failed to update feedback status' });
  }
});

// DELETE /api/feedback/:id - Admin deletes a feedback
router.delete('/:id', authenticateToken, authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user;

    if (!id) {
      res.status(400).json({ message: 'Feedback ID is required' });
      return;
    }

    const deleted = await FeedbackRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Feedback not found or already deleted' });
      return;
    }

    // Log administrative action
    await AuditLogRepository.log({
      actorId: adminUser.id || adminUser._id?.toString() || 'admin',
      actorName: adminUser.name || 'Admin',
      actorEmail: adminUser.email || '',
      action: 'delete_feedback',
      details: `Admin deleted user feedback #${id}`,
    });

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
      id,
    });
  } catch (error) {
    console.error('[Admin Feedback Delete Error]:', error);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
});

export default router;
