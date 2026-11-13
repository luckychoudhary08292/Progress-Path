import express from 'express';
import type { Request, Response } from 'express';
const { Router } = express;
import { authenticateToken } from './auth.ts';
import { EventRepository } from '../repositories.ts';
import {
  sanitizeHtml,
  isValidDateString,
  isValidMonthString,
} from '../middleware/security.ts';
import { SYSTEM_LIMITS } from '../config/limits.ts';

const router = Router();

// GET /api/calendar or /api/calendar/events?month=YYYY-MM&date=YYYY-MM-DD
router.get(['/', '/events'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { month, date } = req.query || {};

    if (typeof month === 'string' && month.trim() !== '' && !isValidMonthString(month)) {
      res.status(400).json({ message: 'Invalid month parameter (expected YYYY-MM)' });
      return;
    }

    if (typeof date === 'string' && date.trim() !== '' && !isValidDateString(date)) {
      res.status(400).json({ message: 'Invalid date parameter (expected valid YYYY-MM-DD)' });
      return;
    }

    const monthStr = typeof month === 'string' && isValidMonthString(month) ? month.trim() : undefined;
    const dateStr = typeof date === 'string' && isValidDateString(date) ? date.trim() : undefined;

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

    // Normalize date to YYYY-MM-DD if ISO string or standard format
    let cleanDate = typeof date === 'string' ? date.trim() : '';
    if (cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0];
    }

    if (!isValidDateString(cleanDate)) {
      res.status(400).json({ message: 'Valid calendar date (YYYY-MM-DD) is required' });
      return;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Event title is required' });
      return;
    }

    if (title.trim().length > SYSTEM_LIMITS.MAX_TITLE_LENGTH) {
      res.status(400).json({
        message: `Event title must not exceed ${SYSTEM_LIMITS.MAX_TITLE_LENGTH} characters`,
      });
      return;
    }

    const [totalUserEvents, dayEvents] = await Promise.all([
      EventRepository.countForUser(userId),
      EventRepository.countForUserDate(userId, cleanDate),
    ]);

    if (totalUserEvents >= SYSTEM_LIMITS.MAX_EVENTS_PER_USER) {
      res.status(403).json({
        message: `Calendar event limit reached (${SYSTEM_LIMITS.MAX_EVENTS_PER_USER} events max per user)`,
        limitReached: true,
        limit: SYSTEM_LIMITS.MAX_EVENTS_PER_USER,
      });
      return;
    }

    if (dayEvents >= SYSTEM_LIMITS.MAX_EVENTS_PER_DAY) {
      res.status(403).json({
        message: `Daily event limit reached (${SYSTEM_LIMITS.MAX_EVENTS_PER_DAY} events max per date)`,
        limitReached: true,
        limit: SYSTEM_LIMITS.MAX_EVENTS_PER_DAY,
      });
      return;
    }

    const eventType: 'academic' | 'task' = type === 'academic' ? 'academic' : 'task';
    const cleanTitle = sanitizeHtml(title.trim());

    const newEvent = await EventRepository.create({
      userId,
      date: cleanDate,
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
