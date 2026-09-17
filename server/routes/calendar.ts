import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { EventModel, EventType } from '../models/Event.ts';
import { authenticateToken } from './auth.ts';

const router = Router();

// GET /api/calendar?month=YYYY-MM&date=YYYY-MM-DD
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { month, date } = req.query;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: any = {
      $or: [{ userId: userObjectId }, { userId: userId }],
    };

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      filter.date = date;
    } else if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      filter.date = { $regex: `^${month}` };
    }

    const events = await EventModel.find(filter).sort({ date: 1, createdAt: 1 }).lean();

    const formattedEvents = events.map((e) => ({
      id: e._id.toString(),
      userId: e.userId.toString(),
      date: e.date,
      title: e.title,
      type: e.type,
      completed: e.completed,
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Find all distinct dates in this month with events for the user
    let datesWithEvents: string[] = [];
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      datesWithEvents = Array.from(new Set(formattedEvents.map((e) => e.date)));
    } else {
      // Month fallback or all dates with events
      const allUserEvents = await EventModel.find({
        $or: [{ userId: userObjectId }, { userId: userId }],
      })
        .select('date')
        .lean();
      datesWithEvents = Array.from(new Set(allUserEvents.map((e) => e.date)));
    }

    res.json({
      events: formattedEvents,
      datesWithEvents,
    });
  } catch (err) {
    console.error('[Calendar GET Error]:', err);
    res.status(500).json({ message: 'Failed to fetch calendar events' });
  }
});

// POST /api/calendar/events
router.post('/events', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { date, title, type } = req.body;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ message: 'Valid date (YYYY-MM-DD) is required' });
      return;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Event title is required' });
      return;
    }

    const validTypes: EventType[] = ['academic', 'task'];
    const eventType: EventType = validTypes.includes(type) ? type : 'task';

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const newEvent = new EventModel({
      userId: userObjectId,
      date,
      title: title.trim(),
      type: eventType,
      completed: false,
      createdAt: new Date(),
    });

    await newEvent.save();

    res.status(201).json({
      id: newEvent._id.toString(),
      userId: userId,
      date: newEvent.date,
      title: newEvent.title,
      type: newEvent.type,
      completed: newEvent.completed,
      createdAt: newEvent.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[Calendar POST Error]:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// PATCH /api/calendar/events/:id/toggle
router.patch('/events/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const eventId = req.params.id;

    if (!eventId) {
      res.status(400).json({ message: 'Event ID is required' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const event = await EventModel.findOne({
      _id: eventId,
      $or: [{ userId: userObjectId }, { userId: userId }],
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    event.completed = !event.completed;
    await event.save();

    res.json({
      id: event._id.toString(),
      userId: userId,
      date: event.date,
      title: event.title,
      type: event.type,
      completed: event.completed,
      createdAt: event.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[Calendar PATCH toggle Error]:', err);
    res.status(500).json({ message: 'Failed to toggle event status' });
  }
});

// DELETE /api/calendar/events/:id
router.delete('/events/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const eventId = req.params.id;

    if (!eventId) {
      res.status(400).json({ message: 'Event ID is required' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const deleted = await EventModel.findOneAndDelete({
      _id: eventId,
      $or: [{ userId: userObjectId }, { userId: userId }],
    });

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
