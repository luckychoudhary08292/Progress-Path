import { Router, Request, Response } from 'express';
import { authenticateToken } from './auth.ts';
import { EventRepository } from '../repositories.ts';
import { sanitizeHtml } from '../middleware/security.ts';

const router = Router();

// GET /api/calendar?month=YYYY-MM&date=YYYY-MM-DD
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { month, date } = req.query || {};

    const monthStr = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) ? month : undefined;
    const dateStr = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

    const events = await EventRepository.listForUser(userId, dateStr, monthStr);

    const datesWithEvents = Array.from(new Set(events.map((e) => e.date)));

    res.json({
      events,
      datesWithEvents,
    });
  } catch (err) {
    console.error('[Calendar GET Error]:', err);
    res.status(500).json({ message: 'Failed to fetch calendar events' });
  }
});

// POST /api/calendar/events or /api/calendar
router.post(['/events', '/'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { date, title, type } = req.body || {};

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required' });
      return;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Event title is required' });
      return;
    }

    const eventType: 'academic' | 'task' = type === 'academic' ? 'academic' : 'task';
    const cleanTitle = sanitizeHtml(title.trim());

    const newEvent = await EventRepository.create({
      userId,
      date,
      title: cleanTitle,
      type: eventType,
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('[Calendar POST Error]:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// PATCH /api/calendar/events/:id/toggle or /api/calendar/:id/toggle
router.patch(['/events/:id/toggle', '/:id/toggle'], authenticateToken, async (req: Request, res: Response) => {
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

    res.json(toggled);
  } catch (err) {
    console.error('[Calendar PATCH toggle Error]:', err);
    res.status(500).json({ message: 'Failed to toggle event status' });
  }
});

// DELETE /api/calendar/events/:id or /api/calendar/:id
router.delete(['/events/:id', '/:id'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const eventId = req.params.id;

    if (!eventId) {
      res.status(400).json({ message: 'Event ID is required' });
      return;
    }

    const deleted = await EventRepository.delete(eventId, userId);
    if (!deleted) {
      res.status(404).json({ message: 'Event not found or not authorized' });
      return;
    }

    res.json({ message: 'Event deleted successfully', id: eventId });
  } catch (err) {
    console.error('[Calendar DELETE Error]:', err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

export default router;
