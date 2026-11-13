import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import { authenticateToken } from './auth.ts';
import { NotificationRepository } from '../repositories.ts';
import { SYSTEM_LIMITS } from '../config/limits.ts';

const router = Router();

const VALID_NOTIFICATION_TYPES = ['task-reminder', 'task-completed', 'system'] as const;

// GET /api/notifications - List all notifications for the authenticated user from DB
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    const notifications = await NotificationRepository.listForUser(userId);
    res.json({ notifications });
  } catch (err) {
    console.error('[Notifications GET Error]:', err);
    res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
});

// POST /api/notifications - Save a new notification for the authenticated user in DB
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { title, body, type } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim() || !body || typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ message: 'Valid title and body strings are required' });
      return;
    }

    const cleanTitle = title.trim().replace(/[<>]/g, '');
    const cleanBody = body.trim().replace(/[<>]/g, '');

    if (cleanTitle.length > SYSTEM_LIMITS.MAX_TITLE_LENGTH || cleanBody.length > 1000) {
      res.status(400).json({
        message: `Title must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} chars and body must not exceed 1000 chars`,
      });
      return;
    }

    const resolvedType = VALID_NOTIFICATION_TYPES.includes(type) ? type : 'task-reminder';

    const created = await NotificationRepository.create({
      userId,
      title: cleanTitle,
      body: cleanBody,
      type: resolvedType,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('[Notifications POST Error]:', err);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// PATCH /api/notifications/read-all - Mark all user notifications as read
router.patch('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    const success = await NotificationRepository.markAllAsRead(userId);
    res.json({ success });
  } catch (err) {
    console.error('[Notifications PATCH read-all Error]:', err);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { id } = req.params;

    const success = await NotificationRepository.markAsRead(id, userId);
    if (!success) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications PATCH read Error]:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// DELETE /api/notifications/clear - CRITICAL USER REQUIREMENT:
// Removes all notification messages for that user profile from DB.
// Strictly DOES NOT touch any tasks, calendar events, or completion status!
router.delete('/clear', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    const clearedCount = await NotificationRepository.clearAllForUser(userId);
    res.json({
      message: 'All notifications cleared successfully',
      clearedCount,
    });
  } catch (err) {
    console.error('[Notifications DELETE clear Error]:', err);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { id } = req.params;

    const success = await NotificationRepository.delete(id, userId);
    if (!success) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications DELETE single Error]:', err);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

export default router;
